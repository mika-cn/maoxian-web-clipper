"use strict";

import T          from './tool.js';
import ExtMsg     from './ext-msg.js';
import Config     from './config.js';

/*
 * @param {String} configName - "clippingHandler" etc.
 * @returns {Object} @see isReadyByName();
 */
async function isReadyByConfig(configName, options = {}) {
  const {config: _config, getHandlerInfoFn = getHandlerInfoThroughBG} = options;
  const config = (_config == undefined ? (await Config.load()) : _config);
  const name = config[configName];
  const r = (await isReadyByName(name, {config, getHandlerInfoFn}));
  return Object.assign({name}, r);
}


/*
 * @param {string} name ~ handler name ("Browser", "NativeApp" etc.)
 * @return {object}
 *   {
 *     ok          => Handler is avariable or not (Only enabled and ready make it's value true).
 *     enabled     => Handler is enabled or not.
 *     handlerInfo => Handler information (if it's disabled, then it's value is an empty object {}).
 *     message     => the reason why ok is false
 *     config      => Config
 *   }
 */
async function isReadyByName(name, options = {}) {
  const {config: _config, getHandlerInfoFn = getHandlerInfoThroughBG} = options;
  const config = (_config == undefined ? (await Config.load()) : _config);

  // return if it's not enabled
  if (!config[`handler${name}Enabled`]) {
    const resp = errResp('g.error.handler.not-enabled', name);
    return Object.assign({
      enabled: false,
      handlerInfo: {},
      config: config
    }, resp);
  }

  try {
    const handlerInfo = await getHandlerInfoFn(name);
  } catch(error) {
    return {
      ok: false,
      message: [error.message, (error.stack || '')].join("\n"),
    };
  }

  if (handlerInfo.ready) {
    return {
      ok: true,
      enabled: true,
      handlerInfo: handlerInfo,
      config: config
    };
  } else {
    const resp = errResp('g.error.handler.not-ready', name);
    if (handlerInfo.message) {
      handlerInfo.message = resp.message + `(${handlerInfo.message})`;
    }
    // feedback handlerInfo.message
    return Object.assign({
      enabled: true,
      handlerInfo: handlerInfo,
      config: config
    }, resp);
  }
}


async function getHandlerInfoThroughBG(name) {
  // content script or extention page
  return ExtMsg.sendToBackground({type: 'handler.get-info', body: {name}})
}

function getHandlerLink(name) {
  const link =  `go.page:extPage.setting?t=${Date.now()}#setting-handler-${T.deCapitalize(name)}`;
  return `<a href='${link}' target='_blank' i18n="g.handler.${T.deCapitalize(name)}.name"></a>`;
}

function errResp(msg, name) {
  const message = [
    `<span i18n="${msg}"></span>`,
    "<span>[ "+ getHandlerLink(name) +" ]</span>"
  ].join("")
  return { ok: false, message: message }
}

export default {isReadyByConfig, isReadyByName};
