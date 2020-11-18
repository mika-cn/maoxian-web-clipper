"use strict";

import ENV         from '../env.js';
import T           from '../lib/tool.js';
import Log         from '../lib/log.js';
import I18N        from '../lib/translation.js';
import MxWcStorage from '../lib/storage.js';
import SavingTool  from '../saving/saving-tool.js';

const APP_NAME = 'maoxian_web_clipper_native';
const state = {port: null, version: null};

function saveClipping(clipping, feedback) {
  getVersion((r) => {
    // compatible with native-app (version < 0.1.7) - no feedback failure.
    let mode = 'completeWhenMainTaskFinished';
    if (r.ok && T.isVersionGteq(r.version, '0.2.0')) {
      mode = 'completeWhenAllTaskFinished';
    }
    SavingTool.startSaving(clipping, feedback, {mode: mode});
    T.each(clipping.tasks, (task) => {
      saveTask(task);
    });
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

function saveTextFile(task) {
  listen();
  task.type = 'text';
  saveTask(task);
}

function saveTask(task) {
  getVersion((r) => {
    if (task.type === 'url' && T.isVersionGteq(r.version, '0.2.4')) {
      // In order to utilize browser's cache
      // we move download to browser.
      // since 0.2.4
      Global.Fetcher.get(task.url, {
        respType: 'blob',
        headers: task.headers,
        timeout: task.timeout,
        tries: task.tries,
      }).then((blob) => {
        const reader = new FileReader();
        reader.onload = function() {
          const binaryString = reader.result;
          task.encode = 'base64'
          task.content = btoa(binaryString);
          task.type = 'download.url'
          state.port.postMessage(task);
        }

        reader.readAsBinaryString(blob);
      },
        (err) => {
          SavingTool.taskFailed(task.filename, err.message);
        }
      );
    } else {
      task.type = ['download', task.type].join('.');
      state.port.postMessage(task);
    }
  });
}

function isMainFile(filename) {
  return (
       filename.endsWith('.html') && !filename.endsWith('.frame.html')
    || filename.endsWith('.md')
    || filename.endsWith('.mxwc'));
}

function responseHandler(resp){
  Log.debug(resp);
  switch(resp.type) {
    case 'download.text':
    case 'download.url':
      const filename = T.sanitizePath(resp.filename);
      if(resp.failed) {
        SavingTool.taskFailed(resp.taskFilename, resp.errmsg);
      } else {
        SavingTool.taskCompleted(resp.taskFilename, {
          fullFilename: filename
        });
        if(isMainFile(filename)){
          const downloadFolder = filename.replace(resp.taskFilename, '');
          updateDownloadFolder(downloadFolder);
        }
      }
      break;
    case 'get.version':
      state.version = resp.version;
      state.rubyVersion = resp.rubyVersion;
      if(state.getVersionCallback){
        state.getVersionCallback({ ok: true, version: resp.version, rubyVersion: resp.rubyVersion });
      }
      break;
    case 'clipping.op.delete':
      if(state.deleteClippingCallback){
        state.deleteClippingCallback(resp);
      }
      break;
    case 'history.refresh':
    case 'history.refresh_v2':
      if(state.refreshHistoryCallback){
        state.refreshHistoryCallback(resp);
      }
      break;
    case 'get.downloadFolder':
      const downloadFolder = T.sanitizePath(resp.downloadFolder);
      updateDownloadFolder(downloadFolder);
      break;
    default: break;
  }
}

// reset state.port when native application disconnected.
function disconnectHandler(port) {
  let errorMessage = null;
  if(browser.runtime.lastError){
    errorMessage = "NativeApp: DisconnectErr:" + browser.runtime.lastError.message;
  }
  if(port.error){
    errorMessage = "NativeApp: DisconnectErr:" + port.error.message;
  }
  if(errorMessage) {
    Log.error(errorMessage);
    if(state.disconnectCallback) {
      state.disconnectCallback(errorMessage);
    }
  }
  state.port = null;
  state.version = null;
}

function updateDownloadFolder(downloadFolder) {
  MxWcStorage.set('downloadFolder', downloadFolder);
}

function initDownloadFolder(config){
  listen();
  state.port.postMessage({type: 'get.downloadFolder'})
}

function getVersion(callback) {
  listen();
  if (state.version) {
    callback({ok: true, version: state.version, rubyVersion: state.rubyVersion});
  } else {
    try{
      state.getVersionCallback = callback;
      state.disconnectCallback = function(message) {
        callback({ok: false, message: message});
      }
      state.port.postMessage({type: 'get.version'})
    } catch(e) {
      // avoid other exception
      callback({ ok: false, message: e.message })
    }
  }
}

function deleteClipping(msg, callback) {
  listen();
  try {
    state.deleteClippingCallback = callback;
    state.disconnectCallback = function(message) {
      callback({ok: false, message: message})
    }
    msg.type = 'clipping.op.delete';
    state.port.postMessage(msg);
  } catch(e) {
    // avoid other exception
    callback({ ok: false, message: e.message })
  }
}

function refreshHistory(msg, callback) {
  getVersion((r) => {
    try {
      let type = 'history.refresh';
      if (r.ok && T.isVersionGteq(r.version, '0.2.6')) {
        type = 'history.refresh_v2';
      }
      state.refreshHistoryCallback = callback;
      state.disconnectCallback = function(message) {
        callback({ok: false, message: message})
      }
      msg.type = type;
      state.port.postMessage(msg);
    } catch(e) {
      // avoid other exception
      callback({ ok: false, message: e.message })
    }
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
  if(!state.port){
    state.port = browser.runtime.connectNative(APP_NAME);
    state.port.onMessage.addListener(responseHandler);
    state.port.onDisconnect.addListener(disconnectHandler);
  }
}

function getInfo(callback) {
  getVersion(function(r) {
    let ready = false, message = '';
    if(r.ok) {
      if(!T.isVersionGteq(r.version, ENV.minNativeAppVersion)) {
        message = I18N.t('g.error.handler.native-app.version')
          .replace('$requiredVersion', ENV.minNativeAppVersion)
          .replace('$currentVersion', r.version);
      } else {
        ready = true;
      }
    } else {
      message = [
        r.message,
        I18N.t('g.error.handler.native-app.install'),
      ].join('<br />');
    }
    callback({
      ready: ready,
      message: message,
      version: r.version,
      rubyVersion: r.rubyVersion,
      supportFormats: ['html', 'md']
    })
  });
}

const ClippingHandler_NativeApp = Object.assign({name: 'NativeApp'}, {
  init,
  saveClipping,
  saveTextFile,
  retryTask,
  handleClippingResult,
  initDownloadFolder,

  getInfo,
  getVersion,
  deleteClipping,
  refreshHistory,
});

export default ClippingHandler_NativeApp;
