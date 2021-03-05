"use strict";

import T           from '../lib/tool.js';
import Log         from '../lib/log.js';
import ExtApi      from '../lib/ext-api.js';
import MxWcStorage from '../lib/storage.js';
import SavingTool  from '../saving/new-saving-tool.js';
import Download    from '../saving/browser-download.js';



function initDownloadFolder(config){
  const filename = [config.rootFolder, 'touch.mxwc'].join('/');
  downloadText({
    filename: filename,
    text: "useless file, delete me :)",
    mimeType: 'text/plain',
  }).then(
    ({id, filename: filePath}) => {
      updateDownloadFolder(filename, filePath);
      ExtApi.eraseDownloadItem(id)
    },
    (errMsg) => {
      //FIXME
    }
  );
}

function saveTextFile(msg) {
  // FIXME feedback
  downloadText(msg);
}


function saveClipping(clipping, feedback) {
  const savingTool = new SavingTool.SaveClipping(clipping, feedback, {
    mode: SavingTool.SaveClipping.MODE.COMPLETE_WHEN_ALL_TASK_FINISHED
  });
  clipping.tasks.forEach((task) => {
    saveTask(task).then(
      ({id, filename}) => {
        savingTool.taskCompleted(task, {
          downloadItemId: id,
          fullFilename: filename,
        });
      },
      (error) => {
        savingTool.taskFailed(task, error.message);
      }
    ).catch((err) => { console.error(err);});
  });
}


function retryTask(task, feedback) {
  const savingTool = new SavingTool.RetryTask(task, feedback);
  savingTool.started();
  saveTask(task).then(
    ({id, filename}) => {
      savingTool.completed();
    },
    (error) => {
      savingTool.failed(error.message);
    }
  );
}


async function saveTask(task) {
  let downloadResult;
  switch(task.type){
    case 'text':
      // html, markdown, styles
      downloadResult = await downloadText(task);
      break;
    case 'url' :
      // images and fonts
      const blob = await fetchUrlTask(task);
      downloadResult = await downloadBlob({filename: task.filename, blob: blob});
      break;
  }
  const {id, filename: filePath} = downloadResult;
  if (task.taskType == 'mainFileTask') {
    updateDownloadFolder(task.filename, filePath);
  } else {
    ExtApi.eraseDownloadItem(id);
  }
  return downloadResult;
}


async function fetchUrlTask(task) {
  Log.debug('fetch', task.url);
  const blob = await Global.Fetcher.get(task.url, {
    respType : 'blob',
    headers  : task.headers,
    timeout  : task.timeout,
    tries    : task.tries,
  });

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
    return newBlob;
  } else {
    return blob;
  }
}


// msg: {filename, :text, :mineType}
function downloadText(msg){
  const arr = [msg.text];
  const opt = {type: msg.mimeType};
  const blob = new Blob(arr, opt);
  const url = URL.createObjectURL(blob);
  return downloadUrl({url: url, filename: msg.filename});
}


// msg: {:filename, :blob}
function downloadBlob(msg){
  const url = URL.createObjectURL(msg.blob);
  return downloadUrl({url: url, filename: msg.filename});
}


// msg: {:filename, :url}
function downloadUrl(msg){
  Log.debug('download.url:', msg.url);
  Log.debug('download.filename:', msg.filename);

  const options = {
    url            : msg.url,
    filename       : msg.filename,
    saveAs         : false,
    conflictAction : 'overwrite',
  };
  const it = new Download(browser.downloads, options);
  return it.download();
}


function updateDownloadFolder(filename, filePath){
  const downloadFolder = filePath.replace(filename, '');
  MxWcStorage.set('downloadFolder', downloadFolder);
}


function handleClippingResult(it) {
  it.url = T.toFileUrl(it.filename);
  return it;
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
