
const ClippingHandler_NativeApp = (function(){
  const APP_NAME = 'maoxian_web_clipper_native';
  const state = {};

  function handle(task) {
    task.type = ['download', task.type].join('.');
    state.port.postMessage(task);
  }

  function responseHandler(resp){
    Log.debug(resp);
    switch(resp.type) {
      case 'download.text':
      case 'download.url':
        const filename = T.sanitizePath(resp.filename);
        if(  filename.endsWith('.html') && !filename.endsWith('.frame.html')
          || filename.endsWith('.md')){
          updateDownloadFold(filename);
          state.completedAction(state.tabId, { handler: 'native-app', filename: filename});
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
    if(browser.runtime.lastError){
      Log.error("NativeApp: DisconnectErr:", browser.runtime.lastError.message);
    }
    if(port.error){
      Log.error("NativeApp: DisconnectErr:", port.error.message);
    }
    state.port = null;
  }

  function setCompletedAction(handler) {
    state.completedAction = handler;
  }

  function updateDownloadFold(filename) {
    const downloadFold = filename.split('mx-wc')[0];
    MxWcStorage.set('downloadFold', downloadFold);
  }

  function initDownloadFold(){
    init();
    state.port.postMessage({type: 'get.downloadFold'})
  }

  function init(tabId, clipId){
    state.tabId = tabId;
    state.clipId = clipId;
    if(!state.port){
      state.port = chrome.runtime.connectNative(APP_NAME);
      state.port.onMessage.addListener(responseHandler);
      state.port.onDisconnect.addListener(disconnectHandler);
    }
  }

  return {
    init: init,
    handle: handle,
    setCompletedAction: setCompletedAction,
    initDownloadFold: initDownloadFold
  }
})();
