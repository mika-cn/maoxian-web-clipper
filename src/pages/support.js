"use strict";

import ENV        from '../js/env.js';
import Log        from '../js/lib/log.js';
import T          from '../js/lib/tool.js';
import ExtApi     from '../js/lib/ext-api.js';
import MxWcConfig from '../js/lib/config.js';
import MxWcLink   from '../js/lib/link.js';

import {CONFIG_KEYS} from '../js/lib/config.js';

function renderBasicInformation() {
  const tpl = T.findElem('basic-information-tpl').innerHTML;
  const html = T.renderTemplate(tpl, {
    extensionVersion: ENV.version,
    minNativeAppVersion: ENV.minNativeAppVersion,
    logLevel: ENV.logLevel,
    isChromeExtension: MxWcLink.isChrome(),
    isMozExtension: MxWcLink.isFirefox()
  });
  T.setHtml("#basic-information > .content", html);
}

function renderRuntimeInformation() {
  ExtApi.getEnvironment().then((env) => {
    const tpl = T.findElem('runtime-information-tpl').innerHTML;
    const html = T.renderTemplate(tpl, {
      os: env.platformInfo.os,
      arch: env.platformInfo.arch,
      nacl_arch: env.platformInfo.nacl_arch
    });
    T.setHtml("#runtime-information > .content", html);
  });
}

function renderConfig() {
  const tpl = "<table><tbody>${config}</tbody></table>";
  MxWcConfig.load().then((config) => {
    let k = null;
    const rows = []
    CONFIG_KEYS.forEach((k) => {
      rows.push(`<tr><th>${k}</th><td>${config[k]}</td></tr>`);
    });
    const html = T.renderTemplate(tpl, {
      config: rows.join('')
    });
    T.setHtml('#configuration-information > .content', html);
  })
}

function init(){
  renderBasicInformation();
  renderConfig();
  setTimeout(() => {
    renderRuntimeInformation();
  }, 200);
}

init();
