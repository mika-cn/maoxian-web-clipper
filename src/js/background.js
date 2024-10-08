import Log         from './lib/log.js';
import ENV         from './env.js';
import T           from './lib/tool.js';
import ExtApi      from './lib/ext-api.js';
import ExtMsg      from './lib/ext-msg.js';
import MxWcIcon    from './lib/icon.js';
import MxWcStorage from './lib/storage.js';
import MxWcConfig  from './lib/config.js';
import MxWcLink    from './lib/link.js';
import MxWcHandler from './lib/handler.js';
import MxEvTarget  from './lib/event-target.js';
import Fetcher     from './lib/fetcher.js';
import TaskFetcher from './lib/task-fetcher.js';

import initBackend_Clipping  from './clipping/backend.js';
import initBackend_Saving    from './saving/backend.js';
import initBackend_Assistant from './assistant/backend.js';
import initBackend_Selection from './selection/backend.js';

import Handler_Browser     from './handler/browser.js';
import Handler_NativeApp   from './handler/native-app.js';
import Handler_WizNotePlus from './handler/wiznoteplus.js';

import BlobUrl       from './background/blob-url.js';
import MxWcMigration from './background/migration.js';
import DeclarativeNetRequest from './background/declarative-net-request.js';

import ContentScriptsLoader from './content-scripts-loader.js';

const Global = { evTarget: new MxEvTarget() };

function messageHandler(message, sender){
  return new Promise(function(resolve, reject){

    //Log.debug(sender, message);
    Log.debug(message.type);
    switch(message.type) {

      case 'get.frame-id':
        resolve(sender.frameId);
        break;

      case 'close.off-screen':
        Log.debug("close off-screen document");
        ExtApi.closeOffscreenDoc().then(resolve);
        break;

      case 'show.badge':
        const badgeAttrs = (message.body || {})
        MxWcIcon.showTabBadge(sender.tab.id, badgeAttrs);
        resolve();
        break;

      case 'hide.badge':
        MxWcIcon.hideTabBadge(sender.tab.id);
        resolve();
        break;

      case 'popup-menu.clip-command':
        // sender.tab is empty on chromium
        const msg = getClipCommandMsg(message.body.command);
        loadContentScriptsAndSendMsg(msg, sender.tab).then(resolve, reject);
        break;

      case 'handler.get-info':
        const handler = getHandlerByName(message.body.name);
        handler.getInfo().then(resolve, reject);
        break;

      case 'handler.native-app.disconnect':
        Handler_NativeApp.disconnect(resolve);
        break;

      case 'handler.native-app.getDownloadFolder':
        Handler_NativeApp.getDownloadFolder(resolve);
        break;

      case 'test.downloadRequest': testDownloadRequest(resolve, reject); break;
      case 'init.downloadFolder': initDownloadFolder()                  ; resolve() ; break ;
      case 'save.category'    : saveCategory(message.body)              ; resolve() ; break ;
      case 'save.tags'        : saveTags(message.body)                  ; resolve() ; break ;
      case 'save.last-tags'   : resetStates('last-tags', message.body)  ; resolve() ; break ;
      case 'save.clippingHistory' : saveClippingHistory(message.body)   ; resolve() ; break ;

      case 'reset.clips'      : resetStates('clips', message.body)      ; resolve() ; break ;
      case 'reset.categories' : resetStates('categories', message.body) ; resolve() ; break ;
      case 'reset.tags'       : resetStates('tags', message.body)       ; resolve() ; break ;

      // history
      case 'export.history':
        exportHistory(message.body.content).then(resolve);
        break;
      case 'clipping.delete':
        deleteClipping(message.body, resolve);
        break;
      case 'history.refresh':
        refreshHistory(resolve);
        break;

      // offline index page
      case 'generate.clipping.js':
        generateClippingJs(resolve);
        break;
      case 'generate.clipping.js.if-need':
        generateClippingJsIfNeed();
        resolve();
        break;

      // open link
      case 'create-tab':
        ExtApi.createTab(message.body.link).then(resolve);
        break;
      case 'asset-cache.peek':
        // not asset cache in service worker
        resolve([]);
        break;
      case 'asset-cache.reset':
        resolve();
        break;

      // backup and restore
      case 'backup-to-file':
        backupToFile().then(resolve);
        break;
      case 'migrate-config':
        migrateConfig(message.body).then(resolve, reject);
        break;
      case 'config.changed':
        configChanged(message.body);
        resolve();
        break;
      default:
        reject(new Error(`background.js: Unknown message: ${message.type}`));
        break;
    }
  });
}


function executeCommand(command) {
  const {exec, args = []} = command;
  const fn = CommandFnDict[exec];
  if (fn) {
    fn(...args)
    Log.debug("execute: ", command);
  } else {
    Log.debug("Couldn't find function to execute, name: ", exec);
  }
}


function getBuiltinCommand(commandName) {
  switch(commandName) {
    case '_doNothing':
      return {exec: 'doNothing'}
    case '_clipAsDefault':
      return {
        exec: 'startClip',
        args: [{badge: {text: null}}]
      };
    case '_clipAsHTML':
      return {
        exec: 'startClip',
        args: [{badge: {text: 'H'}, config: {saveFormat: 'html'}}]
      };
    case '_clipAsMarkdown':
      return {
        exec: 'startClip',
        args: [{badge: {text: 'M'}, config: {saveFormat: 'md'}}]
      }
    case '_openLastClipping':
      return {exec: 'openLastClippingResult'}
    default: break;
  }

  return null;
}


function getUserCommand(commandName, config) {
  let userCommands = {};
  try {
    userCommands = JSON.parse(config.userCommandsText || '{}')
  } catch(e) {
    Log.error("Invalid JSON(userCommandsText): ", config.userCommandsText);
  }

  const dict = userCommands || {};
  return dict[commandName];
}


// TODO fixme
function getClipCommandMsg(command) {
  let clippingArgs = {};
  switch(command) {
    case 'clip-as-default':
    case '_clipAsDefault':
      clippingArgs = {badge: {text: null}};
      break;
    case 'clip-as-html':
    case '_clipAsHTML':
      clippingArgs = {badge: {text: 'H'}, config: {saveFormat: 'html'}};
      break;
    case 'clip-as-md':
    case '_clipAsMarkdown':
      clippingArgs = {badge: {text: 'M'}, config: {saveFormat: 'md'}};
      break;
    default:
      clippingArgs = {badge: {text: null}};
      break;
  }

  const msg = {type: "clip-command", body: [clippingArgs]};
  return msg;
}


function configChanged({key, value}) {
  switch(key) {
    case 'autoRunContentScripts':
      resetAutoRunContentScripts(value)
      break;
    case 'requestCacheCss':
    case 'requestCacheImage':
    case 'requestCacheWebFont':
      updateCacheRules();
      break;
    default:
      break;
  }
}


function deleteClipping(msg, resolve) {
  const handler = Handler_NativeApp;
  handler.deleteClipping(msg, (result) => {
    if(result.ok){
      Global.evTarget.dispatchEvent({
        type: 'clipping.deleted'
      })
    }
    resolve(result);
  })
}

function refreshHistoryIfNeed(){
  MxWcConfig.load().then((config) => {
    if(config.autoRefreshHistory){
      refreshHistory((result) => {
        if(!result.ok) {
          Log.error("AutoRefreshHistory: ");
          Log.error(result.message)
        } else {
          Log.debug("History refreshed");
        }
      });
    }
  });
}


function refreshHistory(resolve) {
  isHandlerReady('refreshHistoryHandler').then((r) => {
    const {ok, message, handler, config} = r;
    if(ok) {
      // init Download Folder
      MxWcStorage.get('downloadFolder').then((root) => {
        if(!root){
          handler.initDownloadFolder(config);
        }
      });

      handler.refreshHistory({
        root_folder: config.rootFolder,
        time: T.currentTime().toString()
      }, (result) => {
        if(result.ok){
            resetStates('clips', result.clippings);
            resetStates('tags', result.tags);
            resetStates('categories', result.categories);
            const time = T.currentTime().toString();
            MxWcStorage.set('lastRefreshHistoryTime', time);
            Global.evTarget.dispatchEvent({
              type: 'history.refreshed'
            });
            resolve({ok: true, time: result.time});
        } else {
          resolve(result);
        }
      })
    } else {
      resolve({ ok: false, message: message});
    }
  });
}

async function exportHistory(content) {
  const s = T.currentTime().str;
  const t = [s.year, s.month, s.day,
    s.hour, s.minute, s.second].join('');

  const params = {
    text: content,
    filename: ['mx-wc-history', t, 'json'].join('.'),
    mimeType: 'application/json',
  };
  return Handler_Browser.saveTextFile(params);
}


async function downloadBlobUrl(downloadParams) {
  const it = new Download(ExtApi.downloads, downloadParams);
  return it.download();
}

function generateClippingJsIfNeed(){
  MxWcConfig.load().then((config) => {
    if(config.autogenerateClippingJs){
      generateClippingJs();
    }
  })
}

function generateClippingJs(callback) {
  isHandlerReady('offlinePageHandler').then((result) => {
    const {ok, message, handler, config} = result;
    if(ok) {
      let pathConfig = MxWcConfig.getDefault().clippingJsPath;
      if(config.clippingJsPath.indexOf('$STORAGE-PATH/') === 0 && config.clippingJsPath.endsWith('js')){
        pathConfig = config.clippingJsPath;
      }
      const filename = pathConfig.replace('$STORAGE-PATH', config.rootFolder);
      MxWcStorage.get('clips', []).then((clippings) => {
        clippings.forEach((it) => {
          // minimize size
          delete it['paths'];
        });
        const json = JSON.stringify(clippings);
        const task = {
          text: `;var clippings = ${json};`,
          mimeType: 'text/javascript',
          filename: filename
        }
        handler.saveTextFile(task);
        const time = T.currentTime().toString();
        MxWcStorage.set('lastGenerateClippingJsTime', time);
        if(callback) {callback({ok: true, time: time})};
      });
    } else {
      if(callback) {
        callback({ok: false, message: message });
      }
    }
  });
}

function testDownloadRequest(resolve, reject) {
  MxWcConfig.load().then((config) => {
    Handler_Browser.testDownloadRequest(config, resolve, reject);
  });
}

function initDownloadFolder(){
  MxWcStorage.get('downloadFolder').then((root) => {
    if(!root){
      getClippingHandler((handler, config) => {
        handler.initDownloadFolder(config);
      });
    }
  });
}

function getClippingHandler(callback) {
  MxWcConfig.load().then((config) => {
    callback(getHandlerByName(config.clippingHandler), config);
  })
}

function resetStates(key, states){
  MxWcStorage.set(key, states);
}


function saveClippingHistory(msg){
  const it = msg.clippingHistory;
  MxWcStorage.get('clips', [])
    .then((v) => {
      v.unshift(it);
      MxWcStorage.set('clips', v);
    })
}

function saveTags(msg){
  const tags = msg.tags;
  MxWcStorage.get('tags', [])
    .then((v) => {
      T.each(tags, function(tag){
        v = T.remove(v, tag);
      });
      T.each(tags, function(tag){
        v.unshift(tag);
      });
      MxWcStorage.set('tags', v);
    });
}

function saveCategory(msg){
  const category = msg.category;
  MxWcStorage.get('categories', [])
    .then((v) => {
      v = T.remove(v, category);
      v.unshift(category);

      MxWcStorage.set('categories', v);
    })
}


function setIconTitle() {
  const title = ["MaoXian Web Clipper", `v${ENV.version}`].join(' ');
  MxWcIcon.setTitle(title);
}


function welcomeNewUser(){
  MxWcStorage.get('firstRunning', true)
    .then((firstRunning) => {
      if(firstRunning){
        MxWcStorage.set('firstRunning', false)
        ExtApi.createTab(MxWcLink.get('extPage.welcome'));
      }
    })
}


// browerCommandName --> userConfiguredCommandName --> {exec, args}
async function commandListener(browserCommandName) {
  Log.debug("shortcutSlot: ", browserCommandName);
  const m = browserCommandName.match(/^slot-(\d+)$/);
  if (m) {
    const config = await MxWcConfig.load();
    const key = 'shortcutSlot' + m[1]
    const commandName = config[key];
    if (commandName) {
      const command = (
           getBuiltinCommand(commandName)
        || getUserCommand(commandName, config)
      );

      if (command) {
        executeCommand(command)
      } else {
        Log.debug("Couldn't find command with name: ", commandName);
      }
    } else {
      Log.debug("Not command is configured with this slot", browserCommandName);
    }
  } else {
    Log.debug("Please use one starts with 'slog-' instead, Deprecated: ", browserCommandName);
  }
}


async function loadContentScriptsAndSendMsg(msg, fromTab) {
  const topFrameId = 0;
  const tab = (fromTab ? fromTab : await ExtApi.getCurrentTab());
  if (!tab) {
    const errorMsg = "We can't get the current tab, don't known where to load content scripts, aborted!";
    Log.error(errorMsg);
    Log.error(msg);
    throw new Error(errorMsg);
  }

  // We don't know whether the top frame has loaded or not yet,
  // just store content message in advanced, So that when it loads,
  // the content message is ready for fetching.
  await storeContentMessage(msg);

  const {loadedFrameIds, errorDetails} = await ContentScriptsLoader.loadInTab(tab.id);

  if (errorDetails.length > 0) {
    const log = ContentScriptsLoader.errorDetails2Str(errorDetails, tab);
    //FIXME log it.
    Log.error(log);

    const lastError = errorDetails[errorDetails.length - 1];
    if (lastError.frameId == topFrameId) {
      // Something unexpected happened.
      await removeContentMessage();
      throw new Error(log);
    }
  }

  if (loadedFrameIds.indexOf(topFrameId) > -1) {
    // We've just loaded content scripts in the top frame,
    // it'll fetch the content message that we stored before.
    //
    // Note that we're not sure when the content script in
    // top frame will set up the background message listener.
    // So we're not sending content message to the top frame here.
    return true;
  } else {
    // The top frame didn't need loading content scripts.
    // It has loaded already. then we can safely sending message to it.
    await removeContentMessage();
    Log.debug("send content message to the top frame");
    return ExtMsg.sendToContent(msg)
  }
}


function storeContentMessage(msg) {
  return MxWcStorage.setToContentSession('content-message', msg);
}

function removeContentMessage() {
  return MxWcStorage.removeFromContentSession('content-message');
}


// ================ command functions ==================

function doNothing() {}

function startClip(...args) {
  const msg = {type: "clip-command", body: args};
  const handleError = (errMsg) => console.error(errMsg);
  loadContentScriptsAndSendMsg(msg).then(
    () => {}, handleError);
}


async function openLastClippingResult() {
  const lastClippingResult = await MxWcStorage.get('lastClippingResult');
  if (!lastClippingResult) { return; }
  const {url, failedTaskNum} = lastClippingResult;
  const pageUrl = MxWcLink.get('extPage.last-clipping-result');
  if (failedTaskNum > 0 ||
    !(url.endsWith('.md') || url.endsWith('.html'))
  ) {
    ExtApi.createTab(pageUrl);
    return;
  }

  const config = await MxWcConfig.load();
  const allowFileSchemeAccess = await ExtApi.isAllowedFileSchemeAccess();
  const allowFileUrlAccess = (allowFileSchemeAccess || config.allowFileSchemeAccess);

  if (url.startsWith('http') || allowFileUrlAccess) {
    MxWcStorage.set('lastClippingResult', null);
    ExtApi.createTab(url);
  } else {
    // We don't use download.open API to open it,
    // because it has weired behavior on background script.
    ExtApi.createTab(pageUrl);
  }
}

const CommandFnDict = {doNothing, startClip, openLastClippingResult};


async function backupToFile() {
  const config = await MxWcConfig.load();
  const filters = [];

  filters.push(T.attributeFilter('config'          , config.backupSettingPageConfig));
  filters.push(T.prefixFilter('history.page.cache' , config.backupHistoryPageConfig));
  filters.push(T.prefixFilter('assistant'          , config.backupAssistantData));
  filters.push(T.prefixFilter('selectionStore'     , config.backupSelectionData));

  //
  // ----- These data won't be backuped -----
  // categories
  // tags
  // clips
  // downloadFolder
  // lastClippingResult
  // firstRunning
  // mx-wc-config-migrated*
  //
  //

  const data = await MxWcStorage.query(...filters);
  const now = T.currentTime();
  const s = now.str
  const t = [s.hour, s.minute, s.second].join('.');
  const content = {data: data, backupAt: now.toString()}

  const params = {
    text: T.toJson(content),
    mimeType: 'application/json',
    filename: `mx-wc-backup_${now.date()}_${t}.json`,
    saveAs: true,
  }
  Handler_Browser.saveTextFile(params);
}

async function migrateConfig(config) {
  const {ok, errMsg} = MxWcConfig.isMigratable(config);
  if (ok) {
    const currConfig = await MxWcConfig.load();
    return MxWcMigration.migrateConfig(config, currConfig);
  } else {
    throw new Error(errMsg);
  }
}
// ========================================
// declarative net request
// ========================================

async function updateCacheRulesIfNeed() {
  const currSwitchStatus = await getCurrentSwitchStatusOfCacheRules();
  if (currSwitchStatus == 'EMPTY') {
    updateCacheRules(currSwitchStatus);
  } else {
    Log.debug("Cache rules is updated in current session, ignore");
  }
}


async function updateCacheRules(switchStatus) {
  let currSwitchStatus;
  if (switchStatus !== undefined) {
    currSwitchStatus = switchStatus;
  } else {
    currSwitchStatus = await getCurrentSwitchStatusOfCacheRules();
  }

  const config = await MxWcConfig.load();
  const newSwitchStatus = DeclarativeNetRequest.getSwitchStatus(config);
  if (currSwitchStatus !== newSwitchStatus) {
    await DeclarativeNetRequest.updateRules(config);
    await setCurrentSwitchStatusOfCacheRules(newSwitchStatus);
    Log.debug("DNR: cache rules updated");
  } else {
    Log.debug("DNR: switchStatus not changed");
  }
}


async function getCurrentSwitchStatusOfCacheRules() {
  const key = 'dnr.cache-rules.switch-status';
  return MxWcStorage.session.get(key, 'EMPTY');
}


async function setCurrentSwitchStatusOfCacheRules(switchStatus) {
  const key = 'dnr.cache-rules.switch-status';
  return MxWcStorage.session.set(key, switchStatus);
}


// ========================================
// auto run content scripts
// ========================================

function resetAutoRunContentScripts(enabled) {
  Log.debug("Auto run content scripts: ", enabled);
  if (enabled) {
    registerContentScripts();
  } else {
    unregisterContentScripts();
  }
}

async function registerContentScriptsIfNeed() {
  const config = await MxWcConfig.load();
  if (config.autoRunContentScripts) {
    await registerContentScripts();
  }
}

async function registerContentScripts() {
  const key = 'content-script.registed.version';
  const version = await MxWcStorage.session.get(key);
  Log.debug("registered version: ", version);
  if (!version || version !== ContentScriptsLoader.VERSION) {
    await ContentScriptsLoader.register();
    await MxWcStorage.session.set(key, ContentScriptsLoader.VERSION);
    Log.debug("New registered, version: ", ContentScriptsLoader.VERSION);
  } else {
    Log.debug("Old registered, version: ", version);
  }
}

async function unregisterContentScripts() {
  const key = 'content-script.registed.version';
  await ContentScriptsLoader.unregister();
  await MxWcStorage.session.remove(key);
  Log.debug("Unregistered content scripts");
}


// ========================================
// handler
// ========================================


// @param {string} expression - see js/lib/handler.js
async function isHandlerReady(configName) {

  const getHandlerInfo = async function (name) {
    const handler = getHandlerByName(name);
    return await handler.getInfo();
  }

  const {ok, name, message, config} = await  MxWcHandler.isReadyByConfig(configName, {getHandlerInfoFn: getHandlerInfo})
  const handler = getHandlerByName(name);
  return {ok, handler, message, config};
}


function getHandlerByName(name) {
  switch(name){
    case 'Browser':     return Handler_Browser;
    case 'NativeApp':   return Handler_NativeApp;
    case 'WizNotePlus': return Handler_WizNotePlus;
    default:            return Handler_Browser;
  }
}

async function updateNativeAppConfig() {
  const config = await MxWcConfig.load();
  if (config.clippingHandler === 'NativeApp') {
    Handler_NativeApp.initDownloadFolder();
  }
}

function initListeners() {
  Global.evTarget.addEventListener('saving.completed', generateClippingJsIfNeed);
  Global.evTarget.addEventListener('history.refreshed', generateClippingJsIfNeed);
  Global.evTarget.addEventListener('clipping.deleted', generateClippingJsIfNeed);
}


async function generateFrameMsgToken({isChrome}) {
  if (isChrome) {
    const key = 'frame-msg-token';
    const token = await MxWcStorage.getFromContentSession(key);
    if (!token) {
      Log.debug("generate frame msg token");
      const value = ['', Date.now(), Math.round(Math.random() * 10000)].join('');
      MxWcStorage.setToContentSession(key, value);
    }
  }
}


const MY_INSTALLED_REASION = 'installed_or_updated_when_not_running';
let onInstalled_running = false;
// Fired when the extension is first installed,
// when the extension is updated to a new version,
// and when the browser is updated to a new version.
//
// reload the extension also trigger this event.
function onInstalled(details) {
  if (aboutToRunning_onInstalled && details.reason !== MY_INSTALLED_REASION) {
    Log.debug("onInstalled is running by triggerOnInstalledIfNeed(), skip");
    return;
  }
  onInstalled_running = true;
  Log.debug("installed reason: ", details.reason);
  ExtApi.setUninstallURL(MxWcLink.get('uninstalled'));
  MxWcMigration.perform();

  const key = 'on-installed.version';
  const {version} = ExtApi.getManifest();
  MxWcStorage.session.set(key, version);
  MxWcStorage.local.set(key, version);
}


let aboutToRunning_onInstalled = false;
// In some weird cases,
// the installed event is not triggered.
// such as the installation happened
// when the extension is disabled.
async function triggerOnInstalledIfNeed() {
  Log.debug("trigger onInstalled if need");
  const manifest = ExtApi.getManifest();
  const key = 'on-installed.version';
  const version = (
       await MxWcStorage.session.get(key)
    || await MxWcStorage.local.get(key)
  );

  if (!version || version !== manifest.version) {
    if (onInstalled_running) {
      Log.debug("onInstalled_running, skip");
      return;
    } else {
      aboutToRunning_onInstalled = true;
      Log.debug("trigger onInstalled by us");
      const fakeDetails = {reason: MY_INSTALLED_REASION};
      onInstalled(fakeDetails);
    }
  }
}


// ========================================

function init() {
  Log.debug("background init...");
  ExtApi.bindOnInstalledListener(onInstalled);
  triggerOnInstalledIfNeed();
  updateCacheRulesIfNeed();
  registerContentScriptsIfNeed();
  MxWcStorage.initContentSession();

  const isChrome = MxWcLink.isChrome();
  const isFirefox = MxWcLink.isFirefox();

  initListeners();
  updateNativeAppConfig();
  generateFrameMsgToken({isChrome});


  TaskFetcher.init({Fetcher});

  Handler_Browser.init(Object.assign({TaskFetcher}, {isChrome}));
  Handler_NativeApp.init({TaskFetcher});
  Handler_WizNotePlus.init({TaskFetcher});

  ExtMsg.listenBackend('background', messageHandler);
  refreshHistoryIfNeed();

  initBackend_Assistant({Fetcher});
  initBackend_Selection();
  initBackend_Clipping({Fetcher});
  initBackend_Saving(Object.assign({
    Handler_Browser,
    Handler_NativeApp,
    Handler_WizNotePlus
  }, {
    evTarget: Global.evTarget,
  }));

  // commands are keyboard shortcuts
  ExtApi.bindOnCommandListener(commandListener)

  setIconTitle();
  welcomeNewUser();
  Log.debug("background init finish...");
}

init();
