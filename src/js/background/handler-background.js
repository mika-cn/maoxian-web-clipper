  "use strict";

  import Log from '../lib/log.js';
  import MxWcConfig from '../lib/config.js';
  import MxWcHandler from '../lib/handler.js';
  import ClippingHandler_Browser from './clipping-handler-browser.js';
  import ClippingHandler_NativeApp from './clipping-handler-native-app.js';
  import ClippingHandler_WizNotePlus from './clipping-handler-wiznoteplus.js';


  function initialize() {
    MxWcConfig.load().then((config) => {
      updateNativeAppConfiguration(config);
    });
  }

  // Native App Config may changed, update it
  function updateNativeAppConfiguration(config){
    const handler = get(config.clippingHandler)
    if(handler.name === 'NativeApp') {
      Log.debug('updateNativeAppConfig');
      handler.initDownloadFolder();
    }
  }

  /*
   * Only avariable in background.
   *
   */
  function get(name) {
    switch(name){
      case 'Browser':
        return ClippingHandler_Browser;
        break;
      case 'NativeApp':
        return ClippingHandler_NativeApp;
        break;
      case 'WizNotePlus':
        return ClippingHandler_WizNotePlus;
        break;
      default:
        // console.debug("Name illegal: ", name);
        // throw new Error("Name illegal: " + name);
        return ClippingHandler_Browser;
    }
  }

  function isReady(exp) {
    return MxWcHandler.isReady(exp, getHandlerInfo);
  }

  function getHandlerInfo(name, callback) {
    const handler = get(name);
    handler.getInfo((handlerInfo) => {
      callback(handlerInfo, handler);
    });
  }


  const HandlerBackground = {
    get: get,
    isReady: isReady,
    initialize: initialize,
  }

  export default HandlerBackground;
