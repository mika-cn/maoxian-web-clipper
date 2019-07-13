
const ClippingHandler_NativeApp = (function(){
  const APP_NAME = 'maoxian_web_clipper_native';
  const state = {};

  function saveClipping(clipping, feedback) {
    init();
    // compatible with native-app (version < 0.1.7)
    SavingTool.startSaving(clipping, feedback, {mode: 'completeWhenMainTaskFinished'});
    T.each(clipping.tasks, (task) => {
      saveTask(task);
    });
  }

  function getTaskFilename(fullFilename) {
    const path = fullFilename.split('mx-wc')[1];
    return ['mx-wc', path].join('');
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
        const taskFilename = getTaskFilename(filename);
        if(resp.failed) {
          SavingTool.taskFailed(taskFilename, resp.errmsg);
        } else {
          SavingTool.taskCompleted(taskFilename, {
            fullFilename: filename
          });
          if(isMainFile(filename)){
            updateDownloadFold(filename);
          }
        }
        break;
      case 'get.version':
        if(state.getVersionCallback){
          state.getVersionCallback({ ok: true, version: resp.version });
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
      case 'get.downloadFold':
        const downloadFold = T.sanitizePath(resp.downloadFold);
        updateDownloadFold(downloadFold);
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
  }

  function updateDownloadFold(filename) {
    const downloadFold = filename.split('mx-wc')[0];
    MxWcStorage.set('downloadFold', downloadFold);
  }

  function initDownloadFold(){
    init();
    state.port.postMessage({type: 'get.downloadFold'})
  }

  function getVersion(callback) {
    init();
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
      state.port = chrome.runtime.connectNative(APP_NAME);
      state.port.onMessage.addListener(responseHandler);
      state.port.onDisconnect.addListener(disconnectHandler);
    }
  }

  return {
    name: 'native-app',
    init: init,
    saveClipping: saveClipping,
    saveTextFile: saveTextFile,
    initDownloadFold: initDownloadFold,

    getVersion: getVersion,
    deleteClipping: deleteClipping,
    refreshHistory: refreshHistory,
  }
})();
