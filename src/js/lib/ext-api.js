
// Web-Extension Api
const ExtApi = {};

/*****************************
 * environment
 *****************************/
ExtApi.locale = browser.i18n.getUILanguage();
//ExtApi.locale = 'zh-CN';

function initEnvironment(){
  // not avariable in content script and popup page
  if(browser.runtime.getPlatformInfo){
    browser.runtime.getPlatformInfo()
      .then((platformInfo) => {
        //"mac" "win" "android" "cros" "linux" "openbsd"
        ExtApi.os = platformInfo.os;
        ExtApi.isWindows = (platformInfo.os === 'win');
        ExtApi.platformInfo = platformInfo;
      });
    //console.debug("init environment");
  }
}
initEnvironment();

/*****************************
 * extension
 *****************************/

ExtApi.getURL = (path) => {
  return browser.extension.getURL(path);
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
  return new Promise(function(resolve, _){
    browser.tabs.query({
      currentWindow: true,
      active: true
    }).then((tabs) => { resolve(tabs[0]) })
    .catch((err) => {console.error(err);});
  })
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
    }).then((frames) => {
      resolve(frames);
    });
  });
}

/*****************************
 * message
 *****************************/

ExtApi.addMessageListener = (listener) => {
  browser.runtime.onMessage.addListener(listener);
}

// To content page
ExtApi.sendMessageToContent = (message, tabId, frameId) => {
  const defaultFrameId = 0;
  const options = {frameId: defaultFrameId};
  if(frameId) { options.frameId = frameId }
  return new Promise(function(resolve, _){
    if(tabId){
      browser.tabs.sendMessage(tabId, message, options)
        .then(resolve)
        .catch((err) => {
          console.log(message);
          console.error(err);
          console.trace();
        })
    }else{
      ExtApi.getCurrentTab().then((tab) => {
        browser.tabs.sendMessage(tab.id, message, options)
          .then(resolve)
          .catch((err) => {
            console.log(message);
            console.log(err)
          })
      })
    }
  })
}

// To extension page except background page.
ExtApi.sendMessageToExtPage = (message) => {
  return browser.runtime.sendMessage(message)
}

// To background page
ExtApi.sendMessageToBackground = (message) => {
  return browser.runtime.sendMessage(message)
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
        }
      });
  })
}

ExtApi.findDownloadItemByPath = (path) => {
  return new Promise(function(resolve, _){
    const query = {limit: 1, state: 'complete'};
    const regexStr = ExtApi.isWindows ? (path.replace(/\//g, '\\\\') + '$') : (path + '$');
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
}

ExtApi.bindDownloadCreatedListener = (listener) => {
  browser.downloads.onCreated.removeListener(listener);
  browser.downloads.onCreated.addListener(listener);
}

ExtApi.bindDownloadChangedListener = (listener) => {
  browser.downloads.onChanged.removeListener(listener);
  browser.downloads.onChanged.addListener(listener);
}
