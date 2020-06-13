"use strict";

import Log from './lib/log.js';
import T from './lib/tool.js';
import ExtMsg from './lib/ext-msg.js';
import MxWcEvent from './lib/event.js';
import MxWcConfig from './lib/config.js';
import MxWcLink from './lib/link.js';
import MxWcSelectionMain from './selection/main.js';
import MxWcSave from './content/save.js';
import UI from './content/ui.js';

import {API_SETTABLE_KEYS} from './lib/config.js';

let state = {};
function resetState() {
  state = {
    config: null,
    /* only avariable in current clipping */
    tempConfig: {},
    yieldPoints: new Set(),
    /* information of current clipping */
    storageConfig: null,
    storageInfo: null,
    clipping: null,
  }
}

function listenMessage(){
  // ExtMsg has initialized in content-frame.js
  ExtMsg.listen('content', function(msg){
    return new Promise(function(resolve, reject){
      switch(msg.type){
        case 'icon.click':
          window.focus();
          activeUI({});
          break;
        case 'clipping.save.started':
          UI.clippingSaveStarted(msg.body);
          break;
        case 'clipping.save.progress':
          UI.clippingSaveProgress(msg.body);
          break;
        case 'clipping.save.completed':
          UI.clippingSaveCompleted(msg.body);
          tellTpClipCompleted(msg.body);
          resetState();
          break;
        case 'page_content.changed':
          pageContentChanged();
          break;
        case 'config.changed':
          configChanged(msg.body);
          break;
        default: break;
      }
      resolve();
    });
  });

  MxWcEvent.listenInternal('selecting', initMutationObserver);
  MxWcEvent.listenInternal('clipping', stopMutationObserver);
  MxWcEvent.listenInternal('idle', stopMutationObserver);
}

let observer = undefined;
function initMutationObserver(e) {
  if(MutationObserver && !observer) {
    observer = new MutationObserver(function(mutationRecords) {
      pageContentChanged();
    })
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true
    });
    Log.debug("init mutation observer");
  }
}

function stopMutationObserver() {
  if(MutationObserver && observer) {
    observer.disconnect();
    observer = undefined;
    Log.debug("stop mutation observer");
  }
}

function listenInternalMessage() {
  MxWcEvent.listenInternal('focus-elem'   , wrapToEventHandler(selectElem));
  MxWcEvent.listenInternal('select-elem'  , wrapToEventHandler(selectElem));
  MxWcEvent.listenInternal('confirm-elem' , wrapToEventHandler(confirmElem));
  MxWcEvent.listenInternal('clip-elem'    , wrapToEventHandler(clipElem));
  Log.debug('listen internal message');
}

// ======================================
// ThirdParty message
// ======================================

/*
 * ThirdParty: userScript or other Extension.
 */
function listenTpMessage(){
  MxWcEvent.listenPublic('focus-elem'        , wrapToEventHandler(selectElem));
  MxWcEvent.listenPublic('select-elem'       , wrapToEventHandler(selectElem));
  MxWcEvent.listenPublic('confirm-elem'      , wrapToEventHandler(confirmElem));
  MxWcEvent.listenPublic('clip-elem'         , wrapToEventHandler(clipElem));
  MxWcEvent.listenPublic('set-form-inputs'   , wrapToEventHandler(setFormInputs));
  MxWcEvent.listenPublic('overwrite-config'  , wrapToEventHandler(overwriteConfig));
  MxWcEvent.listenPublic('set-yielding'      , wrapToEventHandler(setYielding));
  MxWcEvent.listenPublic('unset-yielding'    , wrapToEventHandler(unsetYielding));

  MxWcEvent.listenPublic('resume-actived'    , wrapToEventHandler(resumeActived));
  MxWcEvent.listenPublic('set-saving-hint'   , wrapToEventHandler(setSavingHint));
  MxWcEvent.listenPublic('save-clipping'     , wrapToEventHandler(saveClipping));
  MxWcEvent.listenPublic('exit-clipping'     , wrapToEventHandler(exitClipping));
  MxWcEvent.listenPublic('complete-clipping' , wrapToEventHandler(completeClipping));
  Log.debug('listenTpMessage');
}

/*
 * We don't know third party's code will execute before MaoXian
 * or after it. In order to make sure they can receive this
 * event, We dispatch it multiple times.
 */
function tellTpWeAreReady(){
  const timeouts = [1, 100, 300, 500, 1000, 1600, 2000, 3000, 5000, 8000];
  const emitEvent = function () {
    const timeout = timeouts.shift();
    if (timeout) {
      setTimeout(function(){
        MxWcEvent.dispatchPublic('ready');
        emitEvent();
      }, timeout);
    }
  }
  emitEvent();
}

function tellTpClipCompleted(detail) {
  if (state.config.communicateWithThirdParty) {
    MxWcEvent.dispatchPublic('completed', {
      clipId: detail.clipId,
      handler: detail.handler,
      filename: detail.filename,
      url: detail.url,
      originalUrl: detail.originalUrl,
      completedAt: T.currentTime().toString()
    });
  }
}

function wrapToEventHandler(action) {
  return function(e) {
    const msg = MxWcEvent.getData(e);
    action(msg);
  }
}

function selectElem(msg) {
  queryElem(msg, (elem) => {
    UI.selectElem(elem)
  });
}

function confirmElem(msg) {
  queryElem(msg, (elem) => {
    // deprecated: msg.options
    UI.confirmElem(elem, (msg.formInputs || msg.options || {}));
  });
}

function clipElem(msg) {
  queryElem(msg, (elem) => {
    // deprecated: msg.options
    UI.clipElem(elem, (msg.formInputs || msg.options || {}));
  });
}

function setFormInputs(msg) {
  // deprecated: msg.options
  UI.setFormInputs(msg.formInputs || msg.options || {});
}

function overwriteConfig(msg) {
  const config = (msg.config || {});
  state.tempConfig = {};
  for (let key in config) {
    if (API_SETTABLE_KEYS.indexOf(key) > -1) {
      state.tempConfig[key] = config[key];
    }
  }
}

const YIELDABLE_POINTS = ['actived', 'clipped'];
function setYielding(msg) {
  if (YIELDABLE_POINTS.indexOf(msg.name) > -1) {
    state.yieldPoints.add(msg.name);
  }
}

function unsetYielding(msg) {
  if (YIELDABLE_POINTS.indexOf(msg.name) > -1) {
    state.yieldPoints.delete(msg.name);
  }
}

// FIXME rename me :(
function resumeActived(msg) {
  UI.entryClick(msg);
}

function setSavingHint(msg) {
  UI.setSavingHint(msg.hint);
}

function saveClipping(msg) {
  const {clipping} = msg;
  ExtMsg.sendToBackground({
    type: 'clipping.save',
    body: clipping
  });
  saveClippingHistory(clipping);
}

function exitClipping(msg) {
  const timeout = 500;
  UI.friendlyExit(timeout);
  resetState();
}

function completeClipping(msg) {
  const {result} = msg;
  ExtMsg.sendToBackground({
    type: 'clipping.complete',
    body: result
  });
}


// ======================================

function queryElem(msg, callback){
  let elem = null;
  if(msg.qType === 'css'){
    elem =  T.queryElem(msg.q);
  } else {
    const xpath = msg.q;
    const xpathResult = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    )
    elem = xpathResult.singleNodeValue;
  }
  if(elem){
    callback(elem)
  } else {
    Log.warn("[MaoXian] Can't find elem according to q");
    Log.warn("qType:", msg.qType);
    Log.warn("q:", msg.q);
    console.trace();
  }
}

async function formSubmitted({elem, formInputs, config}) {

  const currConfig = Object.assign(config, state.tempConfig)
  const domain = window.location.host.split(':')[0];
  const pageUrl = window.location.href;

  const {userInput, info, storageInfo, storageConfig} = MxWcSave.getReadyToClip(formInputs, currConfig, {domain, pageUrl})
  state.storageConfig = storageConfig;
  state.storageInfo = storageInfo;

  if (userInput.category != '')  { saveInputHistory('category', userInput.category); }
  if (userInput.tags.length > 0) { saveInputHistory('tags', userInput.tags); }

  const params = Object.assign({info, storageInfo, storageConfig}, {config: currConfig});
  const clipping = await MxWcSave.clip(elem, params);
  Log.debug(clipping);

  UI.setStateClipped({clipping})

  if (state.yieldPoints.has('clipped')) {
    Log.debug("clipped: yield to 3rd party");
    saveClippingHistory(clipping);
  } else {
    saveClipping({clipping});
  }
}

function saveInputHistory(k, v){
  const body = {}
  body[k] = v;
  ExtMsg.sendToBackground({
    type: `save.${k}`,
    body: body
  });
}

function saveClippingHistory(clipping){
  const {storageConfig, storageInfo} = state;
  if (storageConfig.saveInfoFile) {
    const path = T.joinPath(storageInfo.infoFileFolder, storageInfo.infoFileName);
    const clippingHistory = Object.assign({path: path}, clipping.info);
    ExtMsg.sendToBackground({
      type: 'save.clippingHistory',
      body: {clippingHistory: clippingHistory}
    })
  }
}


// user click browser's back/forword button or website PJAX
function listenPopState(){
  window.onpopstate = function(e){
    Log.debug("On pop state");
    UI.remove();
    setTimeout(initialize, 200);
  }
}


let delayPageChanged = undefined;
function pageContentChanged(){
  if(!delayPageChanged) {
    delayPageChanged = T.createDelayCall(function(){
      Log.debug('page content changed');
      UI.windowSizeChanged();
    }, 200);
  }
  delayPageChanged.run();
}

function configChanged(detail) {
  const {key, value} = detail;
  switch(key) {
    case 'hotkeySwitchEnabled':
      if(value == true) {
        T.bindOnce(document, "keydown", toggleSwitch);
      } else {
        T.unbind(document, "keydown", toggleSwitch);
      }
  }
}

function activeUI(e) {
  const clippingState = UI.getCurrState();
  if (clippingState === 'idle') {
    // we're going to active UI
    if (state.config && state.config.communicateWithThirdParty) {
      MxWcEvent.dispatchPublic('actived');
      if (state.yieldPoints.has('actived')) {
        // Do nothing, yield control to 3rd party.
      } else {
        UI.entryClick(e);
      }
    } else {
      UI.entryClick(e);
    }
  } else {
    UI.entryClick(e);
  }
}

/*
 * Hotkey `c` listener
 */
function toggleSwitch(e){
  if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey){ return }
  // 67 keyCode of 'c'
  if(e.keyCode != 67){ return }
  if(e.target.tagName.toUpperCase() === 'BODY'){
    activeUI(e);
  }else{
    Log.debug(e.target.tagName);
  }
}

function initialize(){
  if(state.config.hotkeySwitchEnabled) {
    T.bindOnce(document, "keydown", toggleSwitch);
  }
  T.bind(window, 'resize', function(e){
    UI.windowSizeChanged(e);
  });
  Log.debug("content init...");
}

function run(){
  if (document) {
    if (document.documentElement.tagName.toUpperCase() === 'HTML') {
      // html xhm etc.
      setTimeout(() => {
        resetState();
        MxWcConfig.load().then((config) => {
          state.config = config;
          MxWcSelectionMain.init(config);
          UI.init(config);
          UI.setCallback('submitted', formSubmitted);
          initialize();
          listenMessage();
          listenPopState();
          listenInternalMessage();
          if (config.communicateWithThirdParty) {
            listenTpMessage();
            tellTpWeAreReady();
          }
          MxWcLink.listen(document.body);
        });
      }, 0)
    } else {
      // feed or others
    }
  }
}

run();
