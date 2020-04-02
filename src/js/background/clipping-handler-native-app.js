
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../env.js'),
      require('../lib/tool.js'),
      require('../lib/log.js'),
      require('../lib/translation.js'),
      require('../lib/storage.js'),
      require('./saving-tool.js')
    );
  } else {
    // browser or other
    root.MxWcClippingHandler_NativeApp = factory(
      root.MxWcENV,
      root.MxWcTool,
      root.MxWcLog,
      root.MxWcI18N,
      root.MxWcStorage,
      root.MxWcSavingTool,
    );
  }
})(this, function(ENV, T, Log, I18N, MxWcStorage, SavingTool, undefined) {
  "use strict";

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

  function handleClippingResult(it) {
    it.url = T.toFileUrl(it.filename);
    return it;
  }

  function saveTextFile(task) {
    init();
    task.type = 'text';
    saveTask(task);
  }


  function saveTask(task) {
    task.type = ['download', task.type].join('.');
    state.port.postMessage(task);
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
    init();
    state.port.postMessage({type: 'get.downloadFolder'})
  }

  function getVersion(callback) {
    init();
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
    init();
    try{
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
    init();
    try{
      state.refreshHistoryCallback = callback;
      state.disconnectCallback = function(message) {
        callback({ok: false, message: message})
      }
      msg.type = 'history.refresh';
      state.port.postMessage(msg);
    } catch(e) {
      // avoid other exception
      callback({ ok: false, message: e.message })
    }
  }


  function init(){
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
          message = I18N.t('handler.native-app.error.version')
            .replace('$requiredVersion', ENV.minNativeAppVersion)
            .replace('$currentVersion', r.version);
        } else {
          ready = true;
        }
      } else {
        message = [
          r.message,
          I18N.t('handler.native-app.error.install'),
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

  return {
    name: 'NativeApp',
    saveClipping: saveClipping,
    saveTextFile: saveTextFile,
    handleClippingResult: handleClippingResult,
    initDownloadFolder: initDownloadFolder,

    getInfo: getInfo,
    getVersion: getVersion,
    deleteClipping: deleteClipping,
    refreshHistory: refreshHistory,
  }
});
