
import Log         from './lib/log.js';
import T           from './lib/tool.js';
import ExtApi      from './lib/ext-api.js';
import ExtMsg      from './lib/ext-msg.js';
import MxWcStorage from './lib/storage.js';
import MxWcConfig  from './lib/config.js';
import MxWcLink    from './lib/link.js';
import MxWcHandler from './lib/handler.js';
import MxEvTarget  from './lib/event-target.js';
import Fetcher     from './lib/fetcher.js';

import initBackend_Clipping  from './clipping/backend.js';
import initBackend_Saving    from './saving/backend.js';
import initBackend_Assistant from './assistant/backend.js';
import initBackend_Selection from './selection/backend.js';

import Handler_Browser     from './handler/browser.js';
import Handler_NativeApp   from './handler/native-app.js';
import Handler_WizNotePlus from './handler/wiznoteplus.js';

import MxWcMigration from './background/migration.js';
import WebRequest from './background/web-request.js';

const Global = { evTarget: new MxEvTarget() };

function messageHandler(message, sender){
  return new Promise(function(resolve, reject){
    switch(message.type){

      case 'handler.get-info':
        const handler = getHandlerByName(message.body.name);
        handler.getInfo(resolve);
        break;

      case 'init.downloadFolder': initDownloadFolder()                  ; resolve() ; break ;
      case 'save.category'    : saveCategory(message.body)              ; resolve() ; break ;
      case 'save.tags'        : saveTags(message.body)                  ; resolve() ; break ;
      case 'save.clippingHistory' : saveClippingHistory(message.body)   ; resolve() ; break ;

      case 'reset.clips'      : resetStates('clips', message.body)      ; resolve() ; break ;
      case 'reset.categories' : resetStates('categories', message.body) ; resolve() ; break ;
      case 'reset.tags'       : resetStates('tags', message.body)       ; resolve() ; break ;

      /* history */
      case 'export.history':
        exportHistory(message.body.content);
        resolve();
        break;
      case 'clipping.delete':
        deleteClipping(message.body, resolve);
        break;
      case 'history.refresh':
        refreshHistory(resolve);
        break;

      /* offline index page */
      case 'generate.clipping.js':
        generateClippingJs(resolve);
        break;
      case 'generate.clipping.js.if-need':
        generateClippingJsIfNeed();
        resolve();
        break;

      /* open link */
      case 'create-tab':
        ExtApi.createTab(message.body.link).then(resolve);
        break;
      default:
        break;
    }
  });
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
  isHandlerReady('config.refreshHistoryHandler').then((r) => {
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
          resetStates('clips', result.clips);
          resetStates('tags', result.tags);
          resetStates('categories', result.categories);
          const time = T.currentTime().toString();
          MxWcStorage.set('lastRefreshHistoryTime', time);
          Global.evTarget.dispatchEvent({
            type: 'history.refreshed'
          });
        }
        resolve(result);
      })
    } else {
      resolve({ ok: false, message: message});
    }
  });
}

function exportHistory(content) {
  const arr = [content];
  const blob = new Blob(arr, {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const s = T.currentTime().str;
  const t = [s.year, s.month, s.day, s.hour, s.minute, s.second].join('');
  ExtApi.download({
    saveAs: false,
    filename: ['mx-wc-history', t, 'json'].join('.'),
    url: url
  })
}

function generateClippingJsIfNeed(){
  MxWcConfig.load().then((config) => {
    if(config.autogenerateClippingJs){
      generateClippingJs();
    }
  })
}

function generateClippingJs(callback) {
  isHandlerReady('config.offlinePageHandler').then((result) => {
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

function welcomeNewUser(){
  MxWcStorage.get('firstRunning', true)
    .then((firstRunning) => {
      if(firstRunning){
        MxWcStorage.set('firstRunning', false)
        ExtApi.createTab(MxWcLink.get('extPage.welcome'));
      }
    })
}

// ========================================
// handler
// ========================================

/*
 * @param {string} expression - see js/lib/handler.js
 */
function isHandlerReady(expression) {
  const getHandlerInfo = (name, callback) => {
    const handler = getHandlerByName(name);
    handler.getInfo((handlerInfo) => {
      callback(handlerInfo, handler);
    });
  }
  return MxWcHandler.isReady(expression, getHandlerInfo)
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



// ========================================

const REQUEST_TOKEN = ['', Date.now(), Math.round(Math.random() * 10000)].join('');

Global.evTarget.addEventListener('saving.completed', generateClippingJsIfNeed);
Global.evTarget.addEventListener('history.refreshed', generateClippingJsIfNeed);
Global.evTarget.addEventListener('clipping.deleted', generateClippingJsIfNeed);


function init(){
  Log.debug("background init...");
  MxWcMigration.perform();

  updateNativeAppConfig();

  Fetcher.setRequestToken(REQUEST_TOKEN);
  WebRequest.setRequestToken(REQUEST_TOKEN);
  WebRequest.listen();


  Handler_Browser.init({Fetcher});
  Handler_NativeApp.init({Fetcher});
  Handler_WizNotePlus.init({Fetcher});

  ExtMsg.listen('background', messageHandler);
  refreshHistoryIfNeed();

  initBackend_Assistant({Fetcher});
  initBackend_Selection();
  initBackend_Clipping({WebRequest, Fetcher});
  initBackend_Saving(Object.assign({
    Handler_Browser,
    Handler_NativeApp,
    Handler_WizNotePlus
  }, {evTarget: Global.evTarget}));

  welcomeNewUser();
  Log.debug("background init finish...");
}

init();
