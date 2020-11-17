"use strict";

import T          from './tool.js';
import ExtMsg     from './ext-msg.js';
import MxWcConfig from './config.js';

/*
 * @param {string} exp: expression
 *   - config.$key
 *   - $name
 *
 * @return {object}
 *   {
 *     ok          => Handler is avariable or not (Only enabled and ready make it's value true).
 *     enabled     => Handler is enabled or not.
 *     handlerInfo => Handler information (if it's disabled, then it's value is an empty object {}).
 *     message     => Describe why handler is not ok.
 *     config      => MxWcConfig,
 *     handler     => Handler object (if ok is true and env is background)
 *   }
 */
function isReady(exp, getHandlerInfoFn = getHandlerInfoThroughBG) {
  return new Promise(function(resolve, reject) {
    MxWcConfig.load().then((config) => {

      let name = null;
      if(exp.startsWith('config.')) {
        name = config[exp.replace('config.', '')]
      } else {
        name = exp;
      }

      if(!config[`handler${name}Enabled`]) {
        const resp = errResp('g.error.handler.not-enabled', name);
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
          const resp = errResp('g.error.handler.not-ready', name);
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

      getHandlerInfoFn(name, response);
    });
  });
}

function getHandlerInfoThroughBG(name, callback) {
  // content script or extention page
  ExtMsg.sendToBackground({
    type: 'handler.get-info',
    body: {name: name}
  }).then(callback);
}

function getHandlerLink(name) {
  const link =  `go.page:extPage.setting?t=${Date.now()}#setting-handler-${T.deCapitalize(name)}`;
  return `<a href='${link}' target='_blank' i18n="handler.${T.deCapitalize(name)}.name"></a>`;
}

function errResp(msg, name) {
  const message = [
    `<span i18n="${msg}"></span>`,
    "<span>[ "+ getHandlerLink(name) +" ]</span>"
  ].join("")
  return { ok: false, message: message }
}

export default {isReady};
