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

const state = {
  config: null,
  tempConfig: {}
};

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
  MxWcEvent.listenInternal('focus-elem', selectElem);
  MxWcEvent.listenInternal('select-elem', selectElem);
  MxWcEvent.listenInternal('confirm-elem', confirmElem);
  MxWcEvent.listenInternal('clip-elem', clipElem);
  Log.debug('listen internal message');
}

// ======================================
// ThirdParty message
// ======================================

/*
 * ThirdParty: userScript or other Extension.
 */
function listenTpMessage(){
  MxWcEvent.listenPublic('focus-elem', selectElem);
  MxWcEvent.listenPublic('select-elem', selectElem);
  MxWcEvent.listenPublic('confirm-elem', confirmElem);
  MxWcEvent.listenPublic('clip-elem', clipElem);
  MxWcEvent.listenPublic('set-form-inputs', setFormInputs);
  MxWcEvent.listenPublic('set-temp-config', setTempConfig);
  MxWcEvent.listenPublic('register-yield-point', registerYieldPoint);
  MxWcEvent.listenPublic('deregister-yield-point', deregisterYieldPoint);
  MxWcEvent.listenPublic('resume-actived', resumeActived);
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
      handler: detail.handler,
      filename: detail.filename,
      url: detail.url,
      completedAt: T.currentTime().toString()
    });
  }
}

function selectElem(e) {
  const msg = MxWcEvent.getData(e);
  queryElem(msg, (elem) => {
    UI.selectElem(elem)
  });
}

function confirmElem(e) {
  const msg = MxWcEvent.getData(e);
  queryElem(msg, (elem) => {
    UI.confirmElem(elem, (msg.options || {}));
  });
}

function clipElem(e) {
  const msg = MxWcEvent.getData(e);
  queryElem(msg, (elem) => {
    UI.clipElem(elem, (msg.options || {}));
  });
}

function setFormInputs(e) {
  const msg = MxWcEvent.getData(e);
  UI.setFormInputs(msg.options || {});
}

function setTempConfig(e) {
  const msg = MxWcEvent.getData(e);
  state.tempConfig = (msg.config || {});
}

const YIELDABLE_POINTS = ['actived', 'clipped'];
state.yieldPoints = new Set();
function registerYieldPoint(e) {
  const msg = MxWcEvent.getData(e);
  if (YIELDABLE_POINTS.indexOf(msg.name) > -1) {
    state.yieldPoints.add(msg.name);
  }
}

function deregisterYieldPoint(e) {
  const msg = MxWcEvent.getData(e);
  if (YIELDABLE_POINTS.indexOf(msg.name) > -1) {
    state.yieldPoints.delete(msg.name);
  }
}

// FIXME rename me :(
function resumeActived(e) {
  UI.entryClick(e);
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
  }
}

function formSubmitted({elem, formInputs, config}) {

  const currConfig = Object.assign(config, state.tempConfig)
  const domain = window.location.host.split(':')[0];
  const pageUrl = window.location.href;

  const {userInput, info, storageInfo, storageConfig} = MxWcSave.getReadyToClip(formInputs, currConfig, {domain, pageUrl})

  if (userInput.category != '') {
    saveInputHistory('category', userInput.category);
  }
  if (userInput.tags.length > 0) {
    saveInputHistory('tags', userInput.tags);
  }

  MxWcSave.clip(elem, {info, storageInfo, config, storageConfig})
    .then((clipping) => {
      Log.debug(clipping);
      if (state.yieldPoints.has('clipped')) {
        Log.debug("clipped: yield to 3rd party");
        MxWcEvent.dispatchPublic('clipped', {clipping});
      } else {
        // save clipping
        ExtMsg.sendToBackground({
          type: 'clipping.save',
          body: clipping
        });
      }
      if (storageConfig.saveInfoFile) {
        saveClippingHistory(info, storageInfo);
      }
    });
}

function saveInputHistory(k, v){
  const body = {}
  body[k] = v;
  ExtMsg.sendToBackground({
    type: `save.${k}`,
    body: body
  });
}

function saveClippingHistory(info, storageInfo){
  const path = T.joinPath(storageInfo.infoFileFolder, storageInfo.infoFileName);
  const clippingHistory = Object.assign({path: path}, info);
  ExtMsg.sendToBackground({
    type: 'save.clippingHistory',
    body: {clippingHistory: clippingHistory}
  })
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
