"use strict";

function getRootObjectOfBrowserExtensionAPI() {
  // case A:
  //   If the current browser environment is:
  //     - Any browser with webextension-polyfill loaded.
  //     - or just a firefox based browser
  //
  // case B:
  //   Chromium based browser
  //   without webextension-polyfill loaded
  try { return browser } catch(e) { // case A
  try { return chrome  } catch(e) { // case B
    throw new Error("We couldn't find Browser Extension API root");
  }};
}


function wrapAPIsToObj(obj, apiNames) {
  for (const name of apiNames) {
    const descriptor = {
      get: () => getRootObjectOfBrowserExtensionAPI()[name]
    };
    Object.defineProperty(obj, name, descriptor);
  }
}

// Defined an shortcut name and wrap APIs in it
const _ = {};
wrapAPIsToObj(_, [
  'i18n',
  'runtime',
  'storage',
  'action',
  'browserAction',
  'downloads',
  'extension',
  'tabs',
  'commands',
  'scripting',
  'declarativeNetRequest',
  'webNavigation',
  'offscreen',
]);



// Web-Extension Api
const ExtApi = {};

// Do we really need to expose whole API object
wrapAPIsToObj(ExtApi, [
  'runtime',
  'downloads',
]);


/*****************************
 * environment
 *****************************/
ExtApi.isBackground = () => {
  return (_.tabs !== undefined);
}

ExtApi.getLocale = () => {
  // return 'zh-CN';
  try {
    return _.i18n.getUILanguage();
  } catch(e) {
    return 'en';
  }
}

// not avariable in content script and popup page
ExtApi.getEnvironment = () => {
  return new Promise((resolve, reject) => {
    _.runtime.getPlatformInfo()
      .then((platformInfo) => {
        //"mac" "win" "android" "cros" "linux" "openbsd"
        resolve({
          os: platformInfo.os,
          isWindows: (platformInfo.os === 'win'),
          platformInfo: platformInfo,
        });
      });
    //console.debug("init environment");
  });
}

ExtApi.getManifest = () => {
  return _.runtime.getManifest();
}

ExtApi.getURL = (path) => {
  return _.runtime.getURL(path);
}

// url must have a http or https scheme
ExtApi.setUninstallURL = (url) => {
  if (_.runtime.setUninstallURL) {
    return _.runtime.setUninstallURL(url);
  }
}

ExtApi.getContexts = (params) => {
  return _.runtime.getContexts(params);
}

ExtApi.bindOnInstalledListener = (listener) => {
  _.runtime.onInstalled.removeListener(listener);
  _.runtime.onInstalled.addListener(listener);
}


/*****************************
 * Storage
 *****************************/

// storageArea: "local", "session" etc.
ExtApi.getStorageArea = (storageArea) => {
  return _.storage[storageArea];
}


/*****************************
 * icon and badge
 *****************************/

function getAction() {
  return _.browserAction || _.action;
}

ExtApi.setIconTitle = (title) => {
  getAction().setTitle({title});
}

ExtApi.setTabIcon = (details) => {
  getAction().setIcon(details);
}

/*
 * @param {Integer} tabId
 * @param {Object} badge
 * @param {String|null} badge.text
 * @param {String}      badge.textColor
 * @param {String}      badge.backgroundColor
 *
 */
ExtApi.setTabBadge = (tabId, badge) => {
  if (badge.hasOwnProperty('text')) {
    const {text, textColor, backgroundColor} = badge;
    const action = getAction();
    action.setBadgeText({tabId, text});
    // It's strange that BCD (v5.6.10) indicate that
    // setBadgeTextColor is not supported on Chrome.
    // Chrome has this function that does nothing
    // (the textColor of the badge is always white)
    if (textColor && action.setBadgeTextColor) {
      action.setBadgeTextColor(
        {tabId, color: textColor});
    }
    if (backgroundColor) {
      action.setBadgeBackgroundColor(
        {tabId, color: backgroundColor});
    }
  }
}

/*****************************
 * extension
 *****************************/

/*
 * @return Promise
 */
ExtApi.isAllowedFileSchemeAccess = function(){
  return _.extension.isAllowedFileSchemeAccess();
}

/*****************************
 * tab
 *****************************/

/*
 * @param {string} url - The url of new tab.
 */
ExtApi.createTab = (url) => {
 //https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/create
  return _.tabs.create({url: url});
}

ExtApi.removeTab = (tabId) => {
  return _.tabs.remove(tabId);
}

ExtApi.getCurrentTab = () => {
  return new Promise(function(resolve, reject){
    _.tabs.query({
      currentWindow: true,
      active: true
    }).then((tabs) => {
      if (tabs.length == 1) {
        resolve(tabs[0])
      } else {
        const errMsg =`Expected to get one tab only, but got ${tabs.length}`
        console.error(errMsg);
        console.debug(tabs);
        reject(errMsg);
      }
    }, reject);
  })
}

ExtApi.getAllTabs = () => {
  return new Promise(function(resolve, reject){
    _.tabs.query({
      currentWindow: true
    }).then((tabs) => { resolve(tabs)}, reject);
  })
}

ExtApi.sendTabMsg = (tabId, msg, options = {}) => {
  return _.tabs.sendMessage(tabId, msg, options);
}


/*****************************
 * Scripting
 *****************************/

// @mdn/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/executeScript
/*
 * @param {Object} details
 * @param {Object} details.target {tagId, frameIds, allFrames}
 * @param {Array}  details.files ["path/a", "path/b", ...]
 */
ExtApi.executeContentScript = (details) => {
  return _.scripting.executeScript(details);
}

// @mdn/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/getRegisteredContentScripts
// This function won't return content scripts
// that defined in manifest.json
ExtApi.getRegisteredContentScripts = (filter) => {
  return _.scripting.getRegisteredContentScripts(filter);
}

// @mdn/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/registerContentScripts
ExtApi.registerContentScripts = (scripts) => {
  return _.scripting.registerContentScripts(scripts);
}

// @mdn/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/unregisterContentScripts
ExtApi.unregisterContentScripts = (filter) => {
  return _.scripting.unregisterContentScripts(filter);
}


/*****************************
 * declarativeNetRequest
 *****************************/

// @mdn/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest/updateStaticRules
ExtApi.updateDnrStaticRules = (options) => {
  return _.declarativeNetRequest.updateStaticRules(options);
}

ExtApi.getDnrMatchedRules = (filter) => {
  return _.declarativeNetRequest.getMatchedRules(filter);
}

/*****************************
 * web navigator
 *****************************/

// Not avariable in content Script`
// return a Promise.
ExtApi.getAllFrames = (tabId) => {
  return new Promise(function(resolve, reject) {
    _.webNavigation.getAllFrames({
      tabId: tabId
    }).then(resolve);
  });
}

/*****************************
 * download
 *****************************/

ExtApi.download = (options) => {
  return _.downloads.download(options);
}

ExtApi.openDownloadItem = (downloadItemId) => {
  return _.downloads.open(downloadItemId)
}

ExtApi.eraseDownloadItem = (downloadItemId) => {
  _.downloads.erase({id: downloadItemId, limit: 1});
}

// delete both download history And file
ExtApi.deleteDownloadItem = (downloadItemId) => {
  _.downloads.removeFile(downloadItemId);
  _.downloads.erase({id: downloadItemId, limit: 1});
}

ExtApi.findDownloadItem = (downloadItemId) => {
  return new Promise(function(resolve, reject){
    _.downloads.search({id: downloadItemId, limit: 1})
      .then( function(downloadItems){
        if(downloadItems.length > 0){
          resolve(downloadItems[0])
        } else {
          resolve(undefined);
        }
      });
  })
}

ExtApi.findDownloadItemByPath = (path) => {
  return new Promise(function(resolve, reject){
    ExtApi.getEnvironment().then((env) => {
      const query = {limit: 1, state: 'complete'};
      const regexStr = env.isWindows ? (path.replace(/\//g, '\\\\') + '$') : (path + '$');
      query.filenameRegex = regexStr
        _.downloads.search(query)
        .then( function(downloadItems){
          if(downloadItems.length > 0){
            resolve(downloadItems[0]);
          }else{
            resolve(undefined);
          }
        });
    });
  });
}

ExtApi.bindDownloadCreatedListener = (listener) => {
  _.downloads.onCreated.removeListener(listener);
  _.downloads.onCreated.addListener(listener);
}

ExtApi.bindDownloadChangedListener = (listener) => {
  _.downloads.onChanged.removeListener(listener);
  _.downloads.onChanged.addListener(listener);
}

ExtApi.bindOnCommandListener = (listener) => {
  // Firefox Android does not support Command
  if (_.commands && _.commands.onCommand) {
    _.commands.onCommand.removeListener(listener);
    _.commands.onCommand.addListener(listener);
  }
}

/*****************************
 * commands
 *****************************/

ExtApi.getAllCommands = async () => {
  return _.commands.getAll();
}

ExtApi.updateCommand = async (details) => {
  // not supported on chromium
  if (_.commands.update) {
    return _.commands.update(details);
  } else {
    const error = new Error("Not supported commands.update");
    return Promise.reject(error);
  }
}


/*****************************
 * offscreen
 *****************************/
ExtApi.createOffscreenDoc = (params) => {
  return _.offscreen.createDocument(params);
}

ExtApi.closeOffscreenDoc = () => {
  return _.offscreen.closeDocument();
}

export default ExtApi;
