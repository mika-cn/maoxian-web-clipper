"use strict";

// Web-Extension Api
const ExtApi = {};
const browser = chrome;

// Do we really need to expose whole API object
ExtApi.runtime = browser.runtime;

/*****************************
 * environment
 *****************************/
ExtApi.getLocale = () => {
  // return 'zh-CN';
  try {
    return browser.i18n.getUILanguage();
  } catch(e) {
    return 'en';
  }
}

// not avariable in content script and popup page
ExtApi.getEnvironment = () => {
  return new Promise((resolve, _) => {
    browser.runtime.getPlatformInfo()
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
  return browser.runtime.getManifest();
}

// url must have a http or https scheme
ExtApi.setUninstallURL = (url) => {
  if (browser.runtime.setUninstallURL) {
    return browser.runtime.setUninstallURL(url);
  }
}

/*****************************
 * icon and badge
 *****************************/

ExtApi.action = (browser.browserAction || browser.action);

ExtApi.setIconTitle = (title) => {
  ExtApi.action.setTitle({title});
}

ExtApi.setTabIcon = (tabId, imageData) => {
  ExtApi.action.setIcon({imageData, tabId});
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
  return browser.runtime.getURL(path);
}
/*
 * @return Promise
 */
ExtApi.isAllowedFileSchemeAccess = function(){
  return browser.extension.isAllowedFileSchemeAccess();
}

/*****************************
 * tab
 *****************************/

/*
 * @param {string} url - The url of new tab.
 */
ExtApi.createTab = (url) => {
 //https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/create
  return browser.tabs.create({url: url});
}

ExtApi.removeTab = (tabId) => {
  return browser.tabs.remove(tabId);
}

ExtApi.getCurrentTab = () => {
  return new Promise(function(resolve, reject){
    browser.tabs.query({
      currentWindow: true,
      active: true
    }).then((tabs) => {resolve(tabs[0])}, reject);
  })
}

ExtApi.getAllTabs = () => {
  return new Promise(function(resolve, reject){
    browser.tabs.query({
      currentWindow: true
    }).then((tabs) => { resolve(tabs)}, reject);
  })
}

ExtApi.sendTabMsg = (tabId, msg, options = {}) => {
  return browser.tags.sendMessage(tabId, msg, options);
}

ExtApi.executeContentScript = (tabId, details) => {
  return browser.tabs.executeScript(tabId, details);
}

/*****************************
 * web navigator
 *****************************/

// Not avariable in content Script`
// return a Promise.
ExtApi.getAllFrames = (tabId) => {
  return new Promise(function(resolve, _) {
    browser.webNavigation.getAllFrames({
      tabId: tabId
    }).then(resolve);
  });
}

ExtApi.bindPageDomContentLoadListener = (listener, filter) => {
  ExtApi.unbindPageDomContentLoadedListener(listener);
  browser.webNavigation.onDOMContentLoaded.addListener(listener, filter);
}

ExtApi.unbindPageDomContentLoadedListener = (listener) => {
  if (browser.webNavigation.onDOMContentLoaded.hasListener(listener)) {
    browser.webNavigation.onDOMContentLoaded.removeListener(listener);
  }
}

/*****************************
 * download
 *****************************/

ExtApi.download = (options) => {
  return browser.downloads.download(options);
}

ExtApi.openDownloadItem = (downloadItemId) => {
  return browser.downloads.open(downloadItemId)
}

ExtApi.eraseDownloadItem = (downloadItemId) => {
  browser.downloads.erase({id: downloadItemId, limit: 1});
}

// delete both download history And file
ExtApi.deleteDownloadItem = (downloadItemId) => {
  browser.downloads.removeFile(downloadItemId);
  browser.downloads.erase({id: downloadItemId, limit: 1});
}

ExtApi.findDownloadItem = (downloadItemId) => {
  return new Promise(function(resolve, _){
    browser.downloads.search({id: downloadItemId, limit: 1})
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
  return new Promise(function(resolve, _){
    ExtApi.getEnvironment().then((env) => {
      const query = {limit: 1, state: 'complete'};
      const regexStr = env.isWindows ? (path.replace(/\//g, '\\\\') + '$') : (path + '$');
      query.filenameRegex = regexStr
        browser.downloads.search(query)
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
  browser.downloads.onCreated.removeListener(listener);
  browser.downloads.onCreated.addListener(listener);
}

ExtApi.bindDownloadChangedListener = (listener) => {
  browser.downloads.onChanged.removeListener(listener);
  browser.downloads.onChanged.addListener(listener);
}

ExtApi.bindOnCommandListener = (listener) => {
  // Firefox Android does not support Command
  if (browser.commands && browser.commands.onCommand) {
    browser.commands.onCommand.removeListener(listener);
    browser.commands.onCommand.addListener(listener);
  }
}

ExtApi.getAllCommands = async () => {
  return browser.commands.getAll();
}

ExtApi.updateCommand = async (details) => {
  return browser.commands.update(details);
}

export default ExtApi;
