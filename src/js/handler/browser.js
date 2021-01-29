"use strict";

import T           from '../lib/tool.js';
import Log         from '../lib/log.js';
import ExtApi      from '../lib/ext-api.js';
import MxWcStorage from '../lib/storage.js';
import SavingTool  from '../saving/saving-tool.js';

const state = {
  isListening: false,
  createdFilenameDict: T.createDict(), // downloadItemId => filename (full path)
  taskFilenameDict: T.createDict(), // downloadItemId => taskFilename
};

function saveClipping(clipping, feedback) {
  listen();
  SavingTool.startSaving(clipping, feedback, {mode: 'completeWhenAllTaskFinished'});
  T.each(clipping.tasks, (task) => {
    saveTask(task);
  });
}

function retryTask(task, feedback) {
  listen();
  SavingTool.retryTask(task, feedback);
  saveTask(task);
}

function handleClippingResult(it) {
  it.url = T.toFileUrl(it.filename);
  return it;
}

// msg: {:text, :mineType, :filename}
function downloadText(msg){
  const arr = [msg.text];
  const opt = {type: msg.mimeType};
  const blob = new Blob(arr, opt);
  const url = URL.createObjectURL(blob);
  downloadUrl({url: url, filename: msg.filename});
}

function downloadBlob(msg){
  const url = URL.createObjectURL(msg.blob);
  downloadUrl({url: url, filename: msg.filename});
}

function downloadUrl(msg){
  Log.debug('download.url:', msg.url);
  Log.debug('download.filename:', msg.filename);
  /*
   * Referer and User-Agent are restricted by browser( as unsafe headers) :(
   */
  ExtApi.download({
    conflictAction: 'overwrite',
    saveAs: false,
    filename: msg.filename,
    url: msg.url
  }).then((downloadItemId) => {
    // download started successfully
    state.taskFilenameDict.add(downloadItemId, msg.filename);

    const createdFilename = state.createdFilenameDict.find(downloadItemId);
    if (createdFilename) {
      // We've got filename in downloadCreated event if we are in firefox.
      // see downloadCreated function.
      filenameCreated(downloadItemId, createdFilename);
    }
  }, (rejectMsg) => {
    Log.error(rejectMsg);
    SavingTool.taskFailed(msg.filename, errMsg);
    revokeObjectUrl(msg.url);
  } ).catch((err) => {
    Log.error(err);
    SavingTool.taskFailed(msg.filename, err.message);
    revokeObjectUrl(msg.url);
  });
}

function isMainFile(filename) {
  return (
      filename.endsWith('.html') && !filename.endsWith('.frame.html')
      || filename.endsWith('.md')
      || filename.endsWith('.mxwc'));
}

function downloadCompleted(downloadItemId){
  // file that not download through maoxian web clipper
  state.createdFilenameDict.remove(downloadItemId);
  if(!isDownloadByUs(downloadItemId)) { return false }
  ExtApi.findDownloadItem(downloadItemId)
    .then((downloadItem) => {
      if(downloadItem) {
        const {filename, url} = downloadItem;
        revokeObjectUrl(url);
        if(filename.endsWith('.mxwc')) {
          // touch file
          ExtApi.deleteDownloadItem(downloadItemId);
        } else {
          const taskFilename = state.taskFilenameDict.find(downloadItemId);
          state.taskFilenameDict.remove(downloadItemId);
          SavingTool.taskCompleted(taskFilename, {
            fullFilename: filename,
            downloadItemId: downloadItemId
          });
          if(!isMainFile(filename)) {
            // erase assets download history
            ExtApi.eraseDownloadItem(downloadItemId)
          }
        }
      } else {
        Log.error('<mx-wc>', "Couldn't find DownloadItem using downloadItemId: ", downloadItemId);
      }
    });
}


function filenameCreated(downloadItemId, filename){
  // file that not download through maoxian web clipper
  if(!isDownloadByUs(downloadItemId)) { return false }
  updateDownloadFolder(downloadItemId, filename);
}

function isDownloadByUs(downloadItemId) {
  return state.taskFilenameDict.hasKey(downloadItemId);
}

function updateDownloadFolder(downloadItemId, filename){
  if(isMainFile(filename)){
    // Update download Fold, Cause user might change download fold.
    // Update as soon as possible.
    const taskFilename = state.taskFilenameDict.find(downloadItemId);
    const downloadFolder = filename.replace(taskFilename, '');
    MxWcStorage.set('downloadFolder', downloadFolder);
  }
}

function downloadCreated(e){
  if(e.filename){
    // firefox has filename on downloadCreated but not in downloadChanged
    // download created event is emit before resolve of ExtApi.download
    // and we don't know when ExtApi.download will resolve (we can't
    // just use setTimeout to delay it. cause it'll unstable)
    //
    state.createdFilenameDict.add(e.id, T.sanitizePath(e.filename));
  }
}

//https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/onChanged#downloadDelta
function downloadChanged(e){
  if(e.filename && e.filename.current){
    // chrome have firename on downloadChanged but not in downloadCreated
    filenameCreated(e.id, T.sanitizePath(e.filename.current));
  }

  if(e.state && e.state.current === 'in_progress') {
    // The browser is currently receiving download data from the server.
  }

  if(e.state && e.state.current === 'interrupted') {
    // An error broke the connection with the server.
    // Never reach here :)
    // see fetchAndDownload function.
  }

  if(e.state && e.state.current === 'complete'){
    // The download completed successfully.
    downloadCompleted(e.id);
  }
}

function initDownloadFolder(config){
  listen();
  downloadText({
    mimeType: 'text/plain',
    text: "useless file, delete me :)",
    filename: [config.rootFolder, 'touch.mxwc'].join('/')
  });
}

function saveTextFile(task) {
  listen();
  task.type = 'text';
  saveTask(task);
}

function saveTask(task) {
  switch(task.type){
    // html, markdown, styles
    case 'text': downloadText(task); break;
    case 'blob': downloadBlob(task); break;
    // images and fonts
    case 'url' : fetchAndDownload(task); break;
  }
}

function fetchAndDownload(task) {
  Log.debug('fetch', task.url);
  Global.Fetcher.get(task.url, {
    respType: 'blob',
    headers: task.headers,
    timeout: task.timeout,
    tries: task.tries,
  }).then(
      (blob) => {
        if (Global.isChrome) {
          // Maybe we should add the version to condition too?
          //
          // There is a disgussting bug that Chrome gives Content-Type more priority than provided filename.
          // Which cause the `browser.downloads.download` API overwrites the provided filename's extension.
          //
          // In order to walk around this bug, we change blob's type.
          const fileExtension = T.getFileExtension(task.filename);
          const contentType = T.extension2MimeType(fileExtension);
          const newBlob = blob.slice(0, blob.size, contentType);
          downloadBlob({filename: task.filename, blob: newBlob});
        } else {
          downloadBlob({filename: task.filename, blob: blob});
        }

      },
      (err) => {
        SavingTool.taskFailed(task.filename, err.message);
      }
    );
}

function revokeObjectUrl(url) {
  if(url.match(/^blob:/i)) {
    URL.revokeObjectURL(url);
  }
}

function getInfo(callback) {
  callback({
    ready: true,
    supportFormats: ['html', 'md']
  });
}

/*
 * @param {Object} global
 *   - {Fetcher} Fetcher
 */
let Global = null;
function init(global) {
  Global = global;
}

function listen() {
  if(!state.isListening){
    ExtApi.bindDownloadCreatedListener(downloadCreated);
    ExtApi.bindDownloadChangedListener(downloadChanged);
    state.isListening = true;
  }
}


const ClippingHandler_Browser = Object.assign({name: 'Browser'}, {
  init,
  getInfo,
  saveClipping,
  saveTextFile,
  retryTask,
  handleClippingResult,
  initDownloadFolder,
});

export default ClippingHandler_Browser;
