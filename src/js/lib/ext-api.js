"use strict";

// Web-Extension Api
const ExtApi = {};

function getRootObjectOfBrowserExtensionAPI() {
  try {
    // If the current browser environment is:
    //   - Any browser with webextension-polyfill loaded.
    //   - or just a firefox based browser
    return browser
  } catch (e) {
    try {
      // Chromium based browser
      // without webextension-polyfill loaded
      return chrome
    } catch(e) {
      const emptyRoot = {};
      return emptyRoot;
    }
  }
}

const _ = getRootObjectOfBrowserExtensionAPI();


// Do we really need to expose whole API object
ExtApi.runtime   = _.runtime;
ExtApi.downloads = _.downloads;

/*****************************
 * environment
 *****************************/
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

// url must have a http or https scheme
ExtApi.setUninstallURL = (url) => {
  if (_.runtime.setUninstallURL) {
    return _.runtime.setUninstallURL(url);
  }
}


/*****************************
 * Storage
 *****************************/

// storageArea: "local", "session" etc.
ExtApi.getStorageArea = (storageArea) => {
  if (_.storage[storageArea] === undefined) {
    if (storageArea == 'session') {
      // backport it for some old browsers
      return _.storage.local;
    }
    return undefined;
  } else {
    return _.storage[storageArea];
  }
}


/*****************************
 * icon and badge
 *****************************/

ExtApi.action = (_.browserAction || _.action);

ExtApi.setIconTitle = (title) => {
  ExtApi.action.setTitle({title});
}

ExtApi.setTabIcon = (details) => {
  ExtApi.action.setIcon(details);
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
    ExtApi.action.setBadgeText({tabId, text});
    if (textColor) {
      ExtApi.action.setBadgeTextColor(
        {tabId, color: textColor});
    }
    if (backgroundColor) {
      ExtApi.action.setBadgeBackgroundColor(
        {tabId, color: backgroundColor});
    }
  }
}

/*****************************
 * extension
 *****************************/

ExtApi.getURL = (path) => {
  return _.runtime.getURL(path);
}
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
    }).then((tabs) => {resolve(tabs[0])}, reject);
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

ExtApi.bindPageDomContentLoadListener = (listener, filter) => {
  ExtApi.unbindPageDomContentLoadedListener(listener);
  _.webNavigation.onDOMContentLoaded.addListener(listener, filter);
}

ExtApi.unbindPageDomContentLoadedListener = (listener) => {
  if (_.webNavigation.onDOMContentLoaded.hasListener(listener)) {
    _.webNavigation.onDOMContentLoaded.removeListener(listener);
  }
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

ExtApi.getAllCommands = async () => {
  return _.commands.getAll();
}

ExtApi.updateCommand = async (details) => {
  return _.commands.update(details);
}

export default ExtApi;
