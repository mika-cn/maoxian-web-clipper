"use strict";

import ENV    from '../env.js';
import ExtApi from './ext-api.js';
import ExtMsg from './ext-msg.js';

const extensionRoot = ExtApi.getURL('/');
const extensionId = extensionRoot.split('//')[1].replace('/', '');
const {websiteRoot, projectRoot, mxAssistantRoot, mdnRoot} = ENV;

// Paths that is not packed with extension (project, website etc.)
const externalPaths = {
  "en": {
    "home": "/index.html",
    "faq": "/faq.html",
    "faq-allow-access-file-urls": "/faq.html#allow-access-file-urls",
    "faq-dont-save-index-file": "/faq.html#dont-save-index-file",
    "uninstalled": "/uninstalled.html",
    "assistant": "/assistant/index.html",
    "native-app": "/native-app/index.html",
    "offline-page": "/offline-page/index.html",
    "how-to-write-a-plan": "/assistant/how-to-write-a-plan-zh-CN.html",
    "public-subscriptions": "/assistant/index.html#public-subscriptions",
    "execute-user-script": "/assistant/how-to-write-a-plan-zh-CN.html#action-exec",
    "write-user-script": "/assistant/how-to-write-a-plan-zh-CN.html#user-script",
    "write-user-command": "/user-command-zh-CN.html",
    "project.index": "/",
    "project.issue": "/issues",
    "assistant.subscription.default.index": "/plans/default/index.json",
    "mdn.referrer-policy-header": "/en-US/docs/Web/HTTP/Headers/Referrer-Policy",
    "mdn.request-credentials": "/en-US/docs/web/api/fetch_api/using_fetch#including_credentials"
  },
  "zh-CN": {
    "home": "/index-zh-CN.html",
    "faq": "/faq-zh-CN.html",
    "faq-allow-access-file-urls": "/faq-zh-CN.html#allow-access-file-urls",
    "faq-dont-save-index-file": "/faq-zh-CN.html#dont-save-index-file",
    "uninstalled": "/uninstalled-zh-CN.html",
    "assistant": "/assistant/index-zh-CN.html",
    "native-app": "/native-app/index-zh-CN.html",
    "offline-page": "/offline-page/index-zh-CN.html",
    "how-to-write-a-plan": "/assistant/how-to-write-a-plan-zh-CN.html",
    "public-subscriptions": "/assistant/index-zh-CN.html#public-subscriptions",
    "execute-user-script": "/assistant/how-to-write-a-plan-zh-CN.html#action-exec",
    "write-user-script": "/assistant/how-to-write-a-plan-zh-CN.html#user-script",
    "write-user-command": "/user-command-zh-CN.html",
    "project.index": "/",
    "project.issue": "/issues",
    "assistant.subscription.default.index": "/plans/default/index.json",
    "mdn.referrer-policy-header": "/zh-CN/docs/Web/HTTP/Headers/Referrer-Policy",
    "mdn.request-credentials": "/zh-CN/docs/web/api/fetch_api/using_fetch#including_credentials"
  }
}

/*
 * @param {String} exp
 *   extPage.$name - extension page
 *   $name         - external page's name
 * @example:
 *   get('extPage.setting#hello');
 */
function get(exp) {
  const pageName = exp.split(/[?#]/)[0];
  let pageLink;
  if (pageName.startsWith('extPage.')) {
    pageLink = getExtensionPageLink(pageName);
  } else {
    pageLink = getExternalPageLink(pageName);
  }
  return exp.replace(pageName, pageLink);
}

/*
 * @param {String} pageName
 *   project.$name  - project page's name
 *   $name          - website page's name
 */
function getExternalPageLink(pageName){
  let dict = externalPaths[ExtApi.getLocale()];
  if (!dict) { dict = externalPaths['en'] }
  const path = dict[pageName];
  if(path) {
    if(pageName.startsWith('project.')){
      return projectRoot + path;
    } else if (pageName.startsWith('assistant.')) {
      return mxAssistantRoot + path;
    } else if (pageName.startsWith('mdn.')) {
      return mdnRoot + path;
    } else {
      return websiteRoot + path;
    }
  } else {
    throw new Error(`UnknowPage: ${pageName}(name)`);
  }
}

/*
 * @private
 */
function getExtensionPageLink(pageName){
  const name = pageName.split('.')[1];
  const path = getExtensionPagePath(name);
  return ExtApi.getURL(path);
}

function getExtensionPagePath(name){
  return `/pages/${name}.html`;
}

function isChrome(){
  return !!extensionRoot.match(/^chrome-extension/);
}

function isFirefox(){
  return !!extensionRoot.match(/^moz-extension/);
}

function listen(contextNode) {
  (contextNode || window.document).addEventListener('click', function(e) {
    if(e.target.tagName.toUpperCase() == 'A' && e.target.href.startsWith('go.page:')) {
      const exp = e.target.href.split(':')[1];
      const link = get(exp);
      e.preventDefault();
      if(e.target.target === '_blank') {
        try {
          ExtApi.createTab(link);
        }catch(e) {
          // browser.tabs is not avariable in content script ?
          ExtMsg.sendToBackground({
            type: 'create-tab',
            body: {link: link}
          }).catch((err) => {
            console.warn(err);
            window.location.href = link;
          });
        }
      } else {
        window.location.href = link;
      }
    }
  });
}


const Link = {
  get: get,
  extensionRoot: extensionRoot,
  extensionId: extensionId,
  getExtensionPagePath: getExtensionPagePath,
  isChrome: isChrome,
  isFirefox: isFirefox,
  listen: listen
}

export default Link;
