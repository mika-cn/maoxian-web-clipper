"use strict";

import ENV from './env.js';
import Log from './lib/log.js';
import T from './lib/tool.js';
import ExtApi from './lib/ext-api.js';
import ExtMsg from './lib/ext-msg.js';
import MxWcStorage from './lib/storage.js';
import MxWcConfig from './lib/config.js';
import MxWcLink from './lib/link.js';
import MxWcIcon from './lib/icon.js';

import initBackend_Clipping  from './clipping/backend.js';
import initBackend_Assistant from './assistant/backend.js';
import initBackend_Selection from './selection/backend.js';

import MxWcMigration from './background/migration.js';
import WebRequest from './background/web-request.js';
import ClippingHandler_NativeApp from './background/clipping-handler-native-app.js';
import MxWcHandlerBackground from './background/handler-background.js';

function messageHandler(message, sender){
  return new Promise(function(resolve, reject){
    switch(message.type){
      case 'init.downloadFolder': initDownloadFolder()                  ; resolve() ; break ;
      case 'save.category'    : saveCategory(message.body)              ; resolve() ; break ;
      case 'save.tags'        : saveTags(message.body)                  ; resolve() ; break ;
      case 'save.clippingHistory' : saveClippingHistory(message.body)   ; resolve() ; break ;

      case 'reset.clips'      : resetStates('clips', message.body)      ; resolve() ; break ;
      case 'reset.categories' : resetStates('categories', message.body) ; resolve() ; break ;
      case 'reset.tags'       : resetStates('tags', message.body)       ; resolve() ; break ;
      case 'export.history':
        exportHistory(message.body.content);
        resolve();
        break;
      case 'clipping.save':
        saveClipping(sender.tab.id, message.body);
        resolve();
        break;
      case 'clipping.delete':
        deleteClipping(message.body, resolve);
        break;
      case 'clipping.complete':
        completeClipping(sender.tab.id, message.body);
        break;
      case 'generate.clipping.js':
        generateClippingJs(resolve);
        break;
      case 'generate.clipping.js.if-need':
        generateClippingJsIfNeed();
        resolve();
        break;
      case 'history.refresh':
        refreshHistory(resolve);
        break;
      case 'handler.get-info':
        getHandlerInfo(message.body, resolve);
        break;
      case 'create-tab':
        ExtApi.createTab(message.body.link).then(resolve);
        break;
      default:
        break;
    }
  });
}

function getHandlerInfo(msg, resolve) {
  const handler = MxWcHandlerBackground.get(msg.name);
  handler.getInfo(resolve);
}

function deleteClipping(msg, resolve) {
  const handler = ClippingHandler_NativeApp;
  handler.deleteClipping(msg, (result) => {
    if(result.ok){ generateClippingJsIfNeed() }
    resolve(result);
  })
}

function refreshHistory(resolve) {
  MxWcHandlerBackground.isReady('config.refreshHistoryHandler').then((r) => {
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
          generateClippingJsIfNeed()
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

/*
 * saveTasks
 */

function saveClipping(tabId, clipping) {
  getClippingHandler((handler) => {

    const feedback = function(msg) {
      switch(msg.type) {
        case 'started':
          clippingSaveStarted(tabId, msg);
          break;
        case 'progress':
          clippingSaveProgress(tabId, msg);
          break;
        case 'completed':
          clippingSaveCompleted(tabId, msg.clippingResult, handler);
          break;
        default: break;
      }
    }

    handler.saveClipping(clipping, feedback);
  });
}

function clippingSaveStarted(tabId, msg) {
  Log.debug('started');
  ExtMsg.sendToContent({
    type: 'clipping.save.started',
    body: {
      clipId: msg.clipId
    }
  }, tabId);
}

function clippingSaveProgress(tabId, msg) {
  const progress = [msg.finished, msg.total].join('/');
  Log.debug('progress', progress);
  ExtMsg.sendToContent({
    type: 'clipping.save.progress',
    body: {
      clipId: msg.clipId,
      finished: msg.finished,
      total: msg.total
    }
  }, tabId);
}

function clippingSaveCompleted(tabId, result, handler){
  Log.debug('completed');
  // compatible with old message
  result.handler = handler.name;
  result = handler.handleClippingResult(result);
  Log.debug(result);
  completeClipping(tabId, result);
}

function completeClipping(tabId, result) {
  updateClippingHistory(result);
  ExtMsg.sendToContent({
    type: 'clipping.save.completed',
    body: result
  }, tabId);
  MxWcStorage.set('lastClippingResult', result);
  MxWcIcon.flicker(3);
  generateClippingJsIfNeed();
}


function generateClippingJsIfNeed(){
  MxWcConfig.load().then((config) => {
    if(config.autogenerateClippingJs){
      generateClippingJs();
    }
  })
}

function generateClippingJs(callback) {
  MxWcHandlerBackground.isReady('config.offlinePageHandler').then((result) => {
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

function getClippingHandler(callback) {
  MxWcConfig.load().then((config) => {
    callback(MxWcHandlerBackground.get(config.clippingHandler), config);
  })
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

function resetStates(key, states){
  MxWcStorage.set(key, states);
}

function updateClippingHistory(clippingResult) {
  MxWcStorage.get('clips', [])
    .then((v) => {
      const idx = v.findIndex((it) => {
        return it.clipId == clippingResult.clipId;
      });
      if(idx > -1) {
        Log.debug("UpdateClippingHistory", clippingResult.url);
        v[idx]['url'] = clippingResult.url;
        MxWcStorage.set('clips', v);
      }
    });
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

const REQUEST_TOKEN = ['', Date.now(), Math.round(Math.random() * 10000)].join('');

function init(){
  Log.debug("background init...");
  MxWcMigration.perform();
  MxWcHandlerBackground.initialize();

  WebRequest.setRequestToken(REQUEST_TOKEN);
  WebRequest.listen();

  ExtMsg.listen('background', messageHandler);
  refreshHistoryIfNeed();

  initBackend_Clipping({requestToken: REQUEST_TOKEN,
    WebRequest: WebRequest});
  initBackend_Assistant();
  initBackend_Selection();

  welcomeNewUser();

  Log.debug("background init finish...");
}

init();
