import Log               from './lib/log.js';
import T                 from './lib/tool.js';
import ExtMsg            from './lib/ext-msg.js';
import MxWcStorage       from './lib/storage.js';
import MxWcEvent         from './lib/event.js';
import MxWcConfig        from './lib/config.js';
import MxWcLink          from './lib/link.js';
import MxWcSelectionMain from './selection/main.js';
import Clipper           from './clipping/clipper.js';
import UI                from './content/ui.js';

import {API_SETTABLE_KEYS} from './lib/config.js';

let state = {state: null};
function resetClippingState() {
  // Changed config occured by API or MxAssistant
  // only apply to current clipping
  state.changedConfig = {};
  // Clipping arguments that trigger from menu, hotkey etc. has higest priority
  // {badge, config, extra}
  state.clippingArgs = {};
  YieldPoint.reset();
  // information of current clipping
  state.storageConfig = null;
  state.storageInfo = null;
  state.clipping = null;
  Log.debug("resetClippingState");
}


function messageHandler(msg) {
  return new Promise(function(resolve, reject){
    try {
      switch(msg.type){
        case 'clip-command':
          // browser shortcuts or clicked popup menu
          handleClipCommand(msg.body);
          break;
        case 'saving.started':
          UI.savingStarted(msg.body);
          break;
        case 'saving.progress':
          UI.savingProgress(msg.body);
          break;
        case 'saving.completed':
          UI.savingCompleted(msg.body);
          tellTpCompleted(msg.body);
          break;
        case 'page_content.changed':
          pageContentChanged();
          break;
        case 'config.changed':
          configChanged(msg.body);
          break;
        default: break;
      }
      resolve(true);
    } catch (e) {
      const errMsg = [e.message, e.stack].join("\n");
      Log.debug("bgMsg handler: ", errMsg);
      reject(e);
    }
  });
}



function listenMessage(){
  ExtMsg.listen('content', messageHandler);

  MxWcEvent.listenInternal('selecting', initMutationObserver);
  MxWcEvent.listenInternal('clipping' , stopMutationObserver);
  MxWcEvent.listenInternal('idle'     , stopMutationObserver);

  MxWcEvent.listenInternal('actived', lockWebPage);
  MxWcEvent.listenInternal('clipped', unlockWebPage);
  MxWcEvent.listenInternal('idle'   , unlockWebPage);
  MxWcEvent.listenInternal('idle'   , resetClippingState);
  MxWcEvent.listenInternal('idle'   , hideBadge);
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

function lockWebPage() {
  MxWcEvent.dispatchPageScript('lock');
  Log.debug("lock web page");
}

function unlockWebPage() {
  MxWcEvent.dispatchPageScript('unlock');
  Log.debug("unlock web page");
}


function listenInternalMessage() {
  MxWcEvent.listenInternal('set-form-inputs'   , wrapToEventHandler(setFormInputs));
  MxWcEvent.listenInternal('overwrite-config'  , wrapToEventHandler(overwriteConfig));
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
  const getTpEventHandler = (action) => {
    return wrapToEventHandler(guardEventHandler(action));
  }
  MxWcEvent.listenPublic('focus-elem'        , getTpEventHandler(selectElem));
  MxWcEvent.listenPublic('select-elem'       , getTpEventHandler(selectElem));
  MxWcEvent.listenPublic('confirm-elem'      , getTpEventHandler(confirmElem));
  MxWcEvent.listenPublic('clip-elem'         , getTpEventHandler(clipElem));
  MxWcEvent.listenPublic('set-form-inputs'   , getTpEventHandler(setFormInputs));
  MxWcEvent.listenPublic('set-form-options'  , getTpEventHandler(setFormOptions));
  MxWcEvent.listenPublic('overwrite-config'  , getTpEventHandler(overwriteConfig));
  MxWcEvent.listenPublic('set-yielding'      , getTpEventHandler(setYielding));
  MxWcEvent.listenPublic('unset-yielding'    , getTpEventHandler(unsetYielding));
  MxWcEvent.listenPublic('yield-back'        , getTpEventHandler(yieldBack));

  MxWcEvent.listenPublic('resume-actived'    , getTpEventHandler(resumeActived));
  MxWcEvent.listenPublic('set-saving-hint'   , getTpEventHandler(setSavingHint));

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
        MxWcEvent.dispatchPageScript('set-state', {
          name: '___mxwc_is_ready___',
          value: true
        });
        MxWcEvent.dispatchPublic('ready');
        emitEvent();
      }, timeout);
    }
  }
  emitEvent();
}

function tellTpCompleted(detail) {
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
    action(msg, e.type);
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

function setFormOptions(msg) {
  UI.setFormOptions(msg.formOptions || {});
}

function overwriteConfig(msg) {
  const config = (msg.config || {});
  state.changedConfig = MxWcConfig.filterAPISettableKeys(config);
}


const YieldPoint = {
  yieldablePoints: ['actived', 'confirmed', 'clipped'],
  allowedEventsWhenYield: {
    'actived'   : ['mx-wc.yield-back', 'mx-wc.resume-actived'],
    'confirmed' : ['mx-wc.yield-back'],
    'clipped'   : ['mx-wc.yield-back', 'mx-wc.set-saving-hint'],
  },
  allowedActionsWhenYieldBack: {
    'actived'   : ['exit', 'selecting'],
    'confirmed' : ['exit', 'showForm', 'clipElem'],
    'clipped'   : ['saveClipping', 'completeClipping', 'exitClipping'],
  },
  list: new Set(),
  current: null,
  reset() {
    this.list = new Set();
    this.current = null;
  },
  isValid(name) {
    return this.yieldablePoints.indexOf(name) > -1
  },
  has(name) {
    return this.list.has(name);
  },
  set(name) {
    Log.debug("yieldpoint.set: ", name);
    if (this.isValid(name)) {
      this.list.add(name)
    }
  },
  unset(name) {
    if (this.isValid(name)) {
      this.list.delete(name);
    }
  },
  yield(name) {
    Log.debug("yieldpoint.yield", name);
    if (this.isValid(name)) {
      this.current = name;
    }
  },
  yieldBack(action) {
    Log.debug("yieldback: ", action.name);
    if (this.isValidAction(action.name)) {
      this.current = null;
    } else {
      Log.debug("invalid action: ", action.name);
    }
  },
  isValidEvent(evName) {
    if (this.current) {
      const whiteList = this.allowedEventsWhenYield[this.current];
      return whiteList.indexOf(evName) > -1;
    } else {
      return evName != 'mx-wc.yield-back';
    }
  },
  isValidAction(actionName) {
    if (this.current) {
      const whiteList = this.allowedActionsWhenYieldBack[this.current];
      return whiteList.indexOf(actionName) > -1;
    } else {
      throw new Error("Current yield point is not exist.");
    }
  },
};


function setYielding(msg) {
  YieldPoint.set(msg.name);
}

function unsetYielding(msg) {
  YieldPoint.unset(msg.name);
}

function yieldBack(msg) {
  const action = msg.nextAction;
  if (YieldPoint.isValidAction(action.name)) {
    const yieldPoint = YieldPoint.current;
    YieldPoint.yieldBack(action);
    switch(action.name) {
      case 'exit':
        executeYieldBackActionExit(yieldPoint);
        break;
      case 'selecting':
        executeYieldBackActionSelecting(yieldPoint);
        break;
      case 'showForm':
        executeYieldBackActionShowForm(yieldPoint);
        break;
      case 'clipElem':
        executeYieldBackActionClipElem(yieldPoint, action.msg);
        break;
      case 'saveClipping':
        executeYieldBackActionSaveClipping(yieldPoint, action.msg);
        break;
      case 'completeClipping':
        executeYieldBackActionCompleteClipping(yieldPoint, action.msg);
        break;
      case 'exitClipping':
        executeYieldBackActionExitClipping(yieldPoint);
        break;
      default: break;
    }
  }
}

function hasYieldPoint(name) {
  return YieldPoint.has(name);
}

function setCurrYieldPoint(name) {
  YieldPoint.yield(name)
}


function guardEventHandler(action) {
  return function(msg, evType) {
    if (YieldPoint.isValidEvent(evType)) {
      action(msg, evType);
    } else {
      Log.debug("W > current event: ", evType, " is not valid in current yield point: ", YieldPoint.current);
    }
  }
}


// FIXME rename me :(
function resumeActived(msg) {
  executeYieldBackActionSelecting();
  const action = {name: 'selecting'};
  YieldPoint.yieldBack(action);
}

function executeYieldBackActionSelecting(yieldPoint) {
  Log.debug("Yieldback.selecting from: ", yieldPoint);
  UI.startNewClipping(); // load UI and start selecting
}

function executeYieldBackActionExit(yieldPoint) {
  Log.debug("Yieldback.exit from: ", yieldPoint);
  backToIdleState();
}

async function executeYieldBackActionSaveClipping(yitldPoint, msg) {
  Log.debug("Yieldback.saveClipping from: ", yieldPoint);
  const config = await loadAndMergeConfig();
  saveClipping(Object.merge({config}, msg));
}

function executeYieldBackActionExitClipping(yieldPoint) {
  Log.debug("Yieldback.exitClipping from: ", yieldPoint);
  backToIdleState();
}

function executeYieldBackActionCompleteClipping(yieldPoint, msg) {
  Log.debug("Yieldback.completeClipping from: ", yieldPoint);
  const {result} = msg;
  ExtMsg.sendToBackend('saving', {
    type: 'complete',
    body: result
  });
}

function executeYieldBackActionShowForm(yieldPoint) {
  Log.debug("Yieldback.showForm from: ", yieldPoint);
  UI.recoverFromConfirmedYieldPoint();
  UI.showFormFromYieldPoint();
}


function executeYieldBackActionClipElem(yieldPoint, msg) {
  Log.debug("Yieldback.clipElem from: ", yieldPoint);
  UI.recoverFromConfirmedYieldPoint();
  clipElem(msg);
}


function backToIdleState() {
  const timeout = 500;
  UI.friendlyExit(timeout);
}


function setSavingHint(msg) {
  UI.setSavingHint(msg.hint);
}

function saveClipping(msg) {
  const {clipping, config} = msg;
  saveBlobUrlsToStorage(clipping).then(
    () => {
      ExtMsg.sendToBackend('saving',{
        type: 'save',
        body: {clipping, config}
      });
      saveClippingHistory(clipping);
    },
    (err) => {
      Log.error(err);
    }
  );
}


// blob URL data is not accessable in browser extension
// save them to Storage, so we can access it.
async function saveBlobUrlsToStorage(clipping) {
  const keys = [];
  for (const task of clipping.tasks) {
    if (task.type == 'url' && T.isBlobUrl(task.url)) {
      const key = [clipping.info.clipId, task.url].join('.');
      const blobUrlObj = await fetchBlobUrlData(task.url);
      keys.push(key);
      await MxWcStorage.local.set(key, blobUrlObj);
    }
  }

  if (keys.length > 0) {
    const key = ['blobUrlObjKeys', clipping.info.clipId].join('.');
    const value = keys;
    await ExtMsg.sendToBackend('saving', {
      type: 'session.set',
      body: {key, value}
    });
  }
}

async function fetchBlobUrlData(url) {
  const resp = await window.fetch(url);
  const blob = await resp.blob();
  const mimeType = blob.type;
  const base64Data = await T.blobToBase64Str(blob);
  return {url, mimeType, base64Data};
}



// ======================================

function queryElem(msg, callback){
  let elem = null;
  try {
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
  } catch(e) {
    // illegle selector
    Log.error(e.message)
    Log.error(e)
    console.trace();
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


// note that: currConfig is latest and merged changed config items.
async function formSubmitted({elem, formInputs, currConfig}) {
  const domain    = window.location.host.split(':')[0];
  const pageUrl   = window.location.href;
  const userAgent = window.navigator.userAgent;

  const frames = await ExtMsg.sendToBackend('clipping', {type: 'get.allFrames'});

  const {
    userInput,
    info,
    storageInfo,
    storageConfig,
    i18nLabel,
    requestParams,
    nameConflictResolver,
  } = Clipper.getReadyToClip(formInputs, currConfig, {domain, pageUrl, userAgent})

  state.storageConfig = storageConfig;
  state.storageInfo = storageInfo;

  if (userInput.category != '')  { saveInputHistory('category', userInput.category); }
  if (userInput.tags.length > 0) { saveInputHistory('tags', userInput.tags); }
  if (currConfig.autoInputLastTags) { rememberLastInputTags(userInput.tags); }

  const params = Object.assign({
    info,
    storageInfo,
    storageConfig,
    i18nLabel,
    requestParams,
    frames,
    nameConflictResolver,
  }, {
    config: currConfig,
    win: window,
    platform: getPlatform(),
    pageMetas: getPageMetas(),
  });

  const clipping = await Clipper.clip(elem, params);

  Log.debug(clipping);

  if (hasYieldPoint('clipped')) {
    setCurrYieldPoint('clipped');
  }
  UI.setStateClipped({clipping})
  ExtMsg.sendToBackend('clipping', {
    type: 'clipped',
    body: clipping,
  });

  if (hasYieldPoint('clipped')) {
    Log.debug("clipped: yield to 3rd party");
    saveClippingHistory(clipping);
  } else {
    saveClipping({clipping, config: currConfig});
  }
}

async function loadAndMergeConfig() {
  const config = await MxWcConfig.load()
  return mergeChangedConfig(config);
}


// @param {Object} config - which set by settings page
// @Returns {Object} it - config of current clipping session
// priority:
//   Clipping arguments > changedConfig > Settings config
function mergeChangedConfig(config) {
  return Object.assign(
    config,
    state.changedConfig,
    MxWcConfig.filterAPISettableKeys(state.clippingArgs.config)
  );
}


function getMxEventMsg(config) {
  const currConfig = mergeChangedConfig(config);
  return {
    config: T.sliceObj(currConfig, ['saveFormat']),
    extra: state.clippingArgs.extra,
  }
}


function getPlatform() {
  const platform = {name: 'unknown'};
  if (MxWcLink.isChrome()) {
    platform.name = 'Chrome';
    platform.isChrome = true;
    return platform;
  }

  if (MxWcLink.isFirefox()) {
    platform.name = 'Firefox';
    platform.isFirefox = true;
    return platform;
  }

  return platform;
}


function getPageMetas() {
  let metaKeywords = [];
  const prefix = 'meta_';
  const dict = {};
  document.querySelectorAll('head meta[name]').forEach((it) => {
    if (it.name) {
      const metaName = it.name.toLowerCase();
      const metaValue = (it.content || "");
      dict[prefix + metaName] = metaValue
      if (metaName == 'keywords') {
        metaKeywords = T.splitStrByComma(metaValue);
      }
    }
  });
  dict.metaKeywords = metaKeywords;
  return dict;
}


function rememberLastInputTags(tags) {
  ExtMsg.sendToBackground({type: 'save.last-tags', body: tags});
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
    UI.removeUI();
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


function handleClipCommand(args) {
  toggleClip(...args);
}

/*
 * @param {Object} clippingArgs
 * @param {Object} clippingArgs.badge {text, textColor, backgroundColor}
 * @param {Object} clippingArgs.config {saveFormat}
 * @param {Object} clippingArgs.extra {assistant}
 */
function toggleClip(clippingArgs) {
  window.focus();
  const clippingState = UI.getCurrState();
  if (clippingState === 'idle') {
    // Store clipping arguments that choosen by user.
    state.clippingArgs = clippingArgs;

    if (clippingArgs.badge) { showBadge(clippingArgs.badge) }

    const evMsg = getMxEventMsg((state.config || {}));
    MxWcEvent.dispatchInternal('actived', evMsg);
    // we're going to active UI
    if (state.config && state.config.communicateWithThirdParty) {
      if (hasYieldPoint('actived')) {
        setCurrYieldPoint('actived');
        MxWcEvent.dispatchPublic('actived', evMsg);
      } else {
        MxWcEvent.dispatchPublic('actived', evMsg);
        UI.startNewClipping();
      }
    } else {
      UI.startNewClipping();
    }
  } else {
    UI.cancelCurrentClipping();
  }
}

function initialize(){
  const resizeListener = () => UI.windowSizeChanged();
  T.bind(document, 'resize', resizeListener);
  MxWcEvent.listenPageScript('resize', resizeListener);
  Log.debug("content init...");
}


/*
 * @param {Object} badge
 * @param {String} badge.text
 * @param {String} badge.textColor color of badge text ("green", or "#00ff00")
 * @param {String} badge.backgroundColor color of badge background ("green", or "#00ff00")
 */
function showBadge(badge = {}) {
  if (badge.text) {
    ExtMsg.sendToBackground({type: 'show.badge', body: badge});
  } else {
    hideBadge();
  }
}

function hideBadge() {
  ExtMsg.sendToBackground({type: 'hide.badge'});
}

async function fetchContentMessage() {
  const key = 'content-message';
  try {
    const message = await MxWcStorage.getFromContentSession(key);
    if (message) {
      await MxWcStorage.removeFromContentSession(key);
      messageHandler(message);
    } else {
      // It's possible that this is a registered script
      // then content script is undefined
      Log.debug("Content message is undefined");
    }
  } catch (error) {
    Log.debug(error);
  }
}


function run(){
  if (document) {
    if (document.documentElement.tagName.toUpperCase() === 'HTML') {
      // html xhm etc.
      setTimeout(() => {
        MxWcEvent.init(ExtMsg);
        resetClippingState();
        MxWcConfig.load().then((config) => {
          state.config = config;
          MxWcSelectionMain.init(config);
          UI.init(config);
          UI.setContentFn('submitted', formSubmitted);
          UI.setContentFn('hasYieldPoint', hasYieldPoint);
          UI.setContentFn('setCurrYieldPoint', setCurrYieldPoint);
          UI.setContentFn('getMxEventMsg', getMxEventMsg)
          UI.setContentFn('loadAndMergeConfig', loadAndMergeConfig);
          initialize();
          listenMessage();
          listenPopState();
          listenInternalMessage();
          if (config.communicateWithThirdParty) {
            listenTpMessage();
            tellTpWeAreReady();
          }
          MxWcLink.listen(document.body);
          fetchContentMessage();
        });
      }, 0)
    } else {
      // feed or others
    }
  }
}

run();
