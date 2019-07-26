
(function(global, ExtApi, T) {
  "use strict";

  /*
   * only run in background.
   */
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

  /*
   * @param {string} exp: expression
   *   - config.$key
   *   - $name
   *
   * @return {object}
   *   {
   *     ok          => Handler is avariable or not (Only enabled and ready make it's value true).
   *     enabled     => Handler is enabled or not.
   *     handlerInfo => Handler information (if it's disabled, then it's value is an empty object {}.
   *     message     => Describe why handler is not ok.
   *     config      => MxWcConfig,
   *     handler     => Handler object (if ok is true and env is background)
   *   }
   */
  function isReady(exp, env = 'nobackground') {
    return new Promise(function(resolve, reject) {
      MxWcConfig.load().then((config) => {

        let name = null;
        if(exp.startsWith('config.')) {
          name = config[exp.replace('config.', '')]
        } else {
          name = exp;
        }

        if(!config[`handler${name}Enabled`]) {
          const resp = errResp('error.handler.not-enabled', name);
          resolve(Object.assign({
            enabled: false,
            handlerInfo: {},
            config: config
          }, resp));
          return;
        }

        const response = function(handlerInfo, handler) {
          if(handlerInfo.ready) {
            resolve({
              ok: true,
              enabled: true,
              handlerInfo: handlerInfo,
              config: config,
              handler: handler
            });
          } else {
            const resp = errResp('error.handler.not-ready', name);
            if(handlerInfo.message) {
              handlerInfo.message = resp.message + `(${handlerInfo.message})`;
            }
            // feedback handlerInfo.message
            resolve(Object.assign({
              enabled: true,
              handlerInfo: handlerInfo,
              config: config
            }, resp));
          }
        }

        if(env === 'background') {
          const handler = get(name);
          handler.getInfo((handlerInfo) => {
            response(handlerInfo, handler);
          });
        } else {
          // content script or extention page
          ExtMsg.sendToBackground({
            type: 'handler.get-info',
            body: {name: name}
          }).then(response);
        }

      });
    });
  }

  function getHandlerLink(name) {
    const link =  `go.page:extPage.setting?t=${Date.now()}#setting-handler-${T.deCapitalize(name)}`;
    return [`<a href='${link}' target='_blank'>`, t(`handler.${T.deCapitalize(name)}.name`), "</a>"].join('');
  }

  function errResp(msg, name) {
    const message = [ t(msg),
      " [ "+ getHandlerLink(name) +" ]"
    ].join("")
    return { ok: false, message: message }
  }

  const publicApi = {
    get: get,
    isReady: isReady,
    initialize: initialize,
  }
  global.MxWcHandler = publicApi;
})(this, ExtApi, T);
