"use strict";

import T           from '../lib/tool.js';
import Log         from '../lib/log.js';
import ExtApi      from '../lib/ext-api.js';
import MxWcStorage from '../lib/storage.js';
import BlobUrl     from '../background/blob-url.js';
import SavingTool  from '../saving/new-saving-tool.js';
import Download    from '../saving/browser-download.js';


function testDownloadRequest(config, resolve, reject) {
  const filename = [config.rootFolder, 'mx-wc-test.txt'].join('/');
  downloadText({
    filename: filename,
    text: "useless file, delete me :)",
    mimeType: 'text/plain',
  }).then(
    ({id, filename: filePath}) => {
      if (T.sanitizePath(filePath).endsWith(filename)) {
        resolve();
      } else {
        reject("Download path is not ends with " + filename)
      }
      ExtApi.eraseDownloadItem(id)
    },
    reject
  );;
}


function initDownloadFolder(config){
  const filename = [config.rootFolder, 'mx-wc-touch.txt'].join('/');
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
  return downloadText(msg);
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
  const blob = await Global.TaskFetcher.get(task);

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


// params: {filename, text, mineType, saveAs}
async function downloadText(params){
  const {text, mimeType, filename, saveAs = false} = params;
  const arr = [text];
  const opt = {type: mimeType};
  const blob = new Blob(arr, opt);
  const url = await BlobUrl.create(blob);
  return downloadUrl({url, filename, saveAs});
}


// @param {Object} parmas: {filename, blob, saveAs}
async function downloadBlob(params){
  const {blob, filename, saveAs = false} = params;
  const url = await BlobUrl.create(blob);
  Log.debug(blob.size, blob.type, url);
  return downloadUrl({url, filename, saveAs});
}


// @param {Object} params: {filename, url, saveAs, ...}
async function downloadUrl(params = {}){
  const {url, filename} = params;
  Log.debug('download.url:', url);
  Log.debug('download.filename:', filename);

  const defaultOptions = {
    saveAs : false,
    conflictAction : 'overwrite',
  };

  const options = Object.assign({}, defaultOptions, params);
  const it = new Download(ExtApi.downloads, options);
  it.extraCleanFn = () => {
    if (T.isBlobUrl(url)) {
      BlobUrl.revoke(url);
      Log.debug("revoke: ", url);
    }
  }
  return it.download();
}


function updateDownloadFolder(filename, filePath){
  const downloadFolder = T.sanitizePath(filePath).replace(filename, '');
  MxWcStorage.set('downloadFolder', downloadFolder);
}


function handleClippingResult(it) {
  it.url = T.toLocalUrl(it.filename);
  return it;
}


async function getInfo() {
  return {
    ready: true,
    supportFormats: ['html', 'md']
  };
}


/*
 * @param {Object} global
 *   - {TaskFetcher} TaskFetcher
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
  testDownloadRequest,
});

export default ClippingHandler_Browser;
