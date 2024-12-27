"use strict";
import ENV         from '../env.js';
import T           from '../lib/tool.js';
import Log         from '../lib/log.js';
import ExtApi      from '../lib/ext-api.js';
import MxWcStorage from '../lib/storage.js';
import SavingTool  from '../saving/new-saving-tool.js';

import {
  NativeAppClient,
  NativeMessage,
  DownloadMessage,
  RefreshHistoryMessage,
} from '../saving/native-app-message.js';

// After we change NativeMessage as an optional permission,
// we shouldn't cache the 'get.version' message,
// so we always get the latest state of NativeApp.
//
// const typesToCache = ['get.version'];
const typesToCache = [];
const Client = new NativeAppClient(ExtApi.runtime, typesToCache);

function disconnect(callback) {
  Client.disconnect(callback);
}

function getVersion(callback) {
  getVersionAsync().then(callback,
    (error) => {
      callback({
        ok: false,
        message: error.message
      });
    }
  )
}

async function getVersionAsync() {
  const msg = {type: 'get.version'};
  const resp = await (new NativeMessage(Client, msg)).send();
  return {
    ok: true,
    version: resp.version,
    rubyVersion: resp.rubyVersion,
  }
}


function initDownloadFolder(config){
  getDownloadFolder((r) => {
    if (r.ok) {
      updateDownloadFolder(r.downloadFolder);
    } else {
      // FIXME
    }
  });
}


function getDownloadFolder(callback) {
  const msg = {type: 'get.downloadFolder'};
  (new NativeMessage(Client, msg)).send().then(
    (resp) => {
      callback({ok: true, downloadFolder: T.sanitizePath(resp.downloadFolder)});
    },
    (error) => {
      callback({ok: false, message: error.message});
    }
  );
}


function saveTextFile(msg) {
  msg.type = 'download.text';
  (new DownloadMessage(Client, msg)).send();
}


function saveClipping(clipping, feedback) {
  getVersion((r) => {
    // compatible with native-app (version < 0.1.7) - no feedback failure.
    let mode = SavingTool.SaveClipping.MODE.COMPLETE_WHEN_MAIN_TASK_FINISHED;
    if (r.ok && T.isVersionGteq(r.version, '0.2.0')) {
      mode = SavingTool.SaveClipping.MODE.COMPLETE_WHEN_ALL_TASK_FINISHED;
    }
    const savingTool = new SavingTool.SaveClipping(clipping, feedback, {mode});

    clipping.tasks.forEach((task) => {
      saveTask(task).then(
        ({filename}) => {
          savingTool.taskCompleted(task, {
            fullFilename: filename
          });
        },
        (error) => {
          savingTool.taskFailed(task, error.message);
        }
      ).catch((err) => { console.error(err);});
    });

  });
}


function retryTask(task, feedback) {
  const savingTool = new SavingTool.RetryTask(task, feedback);
  savingTool.started();
  saveTask(task).then(
    ({filename}) => {
      savingTool.completed();
    },
    (error) => {
      savingTool.failed(error.message);
    }
  );
}


async function saveTask(task) {
  const r = await getVersionAsync();
  let response = null;
  if (task.type === 'url' && T.isVersionGteq(r.version, '0.2.4')) {
    // In order to utilize browser's cache
    // we move download to browser.
    // since 0.2.4
    const blob = await fetchUrlTask(task);
    const binStr = await T.blob2BinaryString(blob);
    const msg = Object.assign({}, task, {
      type: 'download.url',
      encode: 'base64',
      content: btoa(binStr)
    });

    response = await (new DownloadMessage(Client, msg)).send();

  } else {
    const msg = Object.assign({}, task, {
      type: ['download', task.type].join('.')
    })
    response = await (new DownloadMessage(Client, msg)).send();
  }

  const filePath = T.sanitizePath(response.filename);
  if (response.failed) {
    throw new Error(response.errMsg);
  } else {
    if (task.taskType == 'mainFileTask') {
      const downloadFolder = T.sanitizePath(filePath).replace(task.filename, '');
      updateDownloadFolder(downloadFolder);
    }
    return {filename: filePath};
  }
}


async function fetchUrlTask(task) {
  return await Global.TaskFetcher.get(task);
}


function deleteClipping(msg, callback) {
  try {
    msg.type = 'clipping.op.delete';
    (new NativeMessage(Client, msg)).send().then(
      (resp) => { callback(resp); },
      (error) => { callback({ok: false, message: error.message}) }
    );
  } catch(e) {
    // avoid other exception
    callback({ ok: false, message: e.message })
  }
}


function refreshHistory(msg, callback) {
  getVersion((r) => {
    let type = 'history.refresh';
    if (r.ok && T.isVersionGteq(r.version, '0.2.6')) {
      type = 'history.refresh_v2';
    }
    msg.type = type;
    (new RefreshHistoryMessage(Client, msg)).send().then(
      (resp) => { callback(resp); },
      (error) => { callback({ok: false, message: error.message}) }
    );
  });
}



function updateDownloadFolder(downloadFolder) {
  MxWcStorage.set('downloadFolder', downloadFolder);
}


function handleClippingResult(it) {
  it.url = T.toLocalUrl(it.filename);
  return it;
}


async function getInfo(callback) {
  let r;
  try {
    r = await getVersionAsync();
  } catch (error) {
    r = {ok: false, message: error.message};
  }

  let ready = false, message = '';
  if(r.ok) {
    if(!T.isVersionGteq(r.version, ENV.minNativeAppVersion)) {
      message = Global.I18N.s('native-app.version-invalid', {
        requiredVersion: ENV.minNativeAppVersion,
        currentVersion: r.version,
      });
    } else {
      ready = true;
    }
  } else {
    message = [
      r.message,
      Global.I18N.t('native-app.not-installed'),
    ].join('<br />');
  }

  return {
    ready: ready,
    message: message,
    version: r.version,
    rubyVersion: r.rubyVersion,
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


const ClippingHandler_NativeApp = Object.assign({name: 'NativeApp'}, {
  init,
  saveClipping,
  saveTextFile,
  retryTask,
  handleClippingResult,
  getDownloadFolder,
  initDownloadFolder,

  disconnect,
  getInfo,
  getVersion,
  deleteClipping,
  refreshHistory,
});

export default ClippingHandler_NativeApp;
