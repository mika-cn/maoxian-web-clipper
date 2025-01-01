"use strict";

// Web-Extension Api
const ExtApi = {};

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

ExtApi.getCurrentActiveTab = () => {
  return new Promise(function(resolve, reject){
    browser.tabs.query({
      currentWindow: true,
      active: true
    }).then((tabs) => {resolve(tabs[0])}, reject);
  })
};

// TODO Deprecated, remove me
ExtApi.getCurrentTab = () => {
  return ExtApi.getCurrentActiveTab();
}

ExtApi.getAllTabs = () => {
  return new Promise(function(resolve, reject){
    browser.tabs.query({
      currentWindow: true
    }).then((tabs) => { resolve(tabs)}, reject);
  })
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
