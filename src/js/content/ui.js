;(function (root, factory) {
  root.MxWcUI = factory(
    root.MxWcLog,
    root.MxWcTool,
    root.MxWcExtApi,
    root.MxWcFrameMsg,
    root.MxWcEvent,
    root.MxWcHandler,
    root.MxWcSave,
    root.MxWcNotify,
    root.MxWcSelectionMain
  );
})(this, function(Log, T, ExtApi, FrameMsg,
    MxWcEvent, MxWcHandler, MxWcSave,
  Notify, MxWcSelectionMain, undefined) {
  "use strict";

  const state = {
    clippingState: 'idle',
    currElem: null,
    config: null,
    deletedElems: []
  };

  // ifarme common functions

  function appendIframe(){
    this.element = initializeIframe(this.src());
    this.element.id = this.id;
    this.appendExtraStyle();
    this.element.addEventListener('load', () => {
      this.frameLoaded();
    });
    //document.body.appendChild(this.element);
    document.body.parentElement.appendChild(this.element);
    Log.debug(this.id, 'append');
  }

  function removeIframe(){
    this.ready = false;
    if(this.element){
      //document.body.removeChild(this.element);
      document.body.parentElement.removeChild(this.element);
      this.element = null;
      Log.debug(this.id, 'removed');
    }
  }

  // selection layer
  const selectionIframe = {
    id: 'mx-wc-iframe-selection',
    ready: false,
    src: function(){
      const url =  ExtApi.getURL('/pages/ui-selection.html');
      return url + "?t=" + btoa(window.location.origin)
    },
    append: appendIframe,
    appendExtraStyle: function(){
      this.element.style.zIndex = "2147483646";
      this.element.style.setProperty("position", "absolute", "important");
      this.element = updateFrameSize(this.element);
    },
    remove: removeIframe,
    frameLoaded: function(){
      this.ready = true;
      dispatchFrameLoadedEvent(this.id);
    }
  }

  // status & form layer
  const controlIframe = {
    id: 'mx-wc-iframe-control',
    ready: false,
    src: function(){
      const url =  ExtApi.getURL('/pages/ui-control.html');
      return url + "?t=" + btoa(window.location.origin)
    },
    append: appendIframe,
    appendExtraStyle: function(){
      this.element.style.height = '100%';
      this.element.style.zIndex = "2147483647";
      this.element.style.setProperty("position", "fixed", "important");
    },
    remove: removeIframe,
    frameLoaded: function(){
      this.element.focus();
      this.ready = true;
      dispatchFrameLoadedEvent(this.id);
    }
  }

  function dispatchFrameLoadedEvent(frameId) {
    Log.debug(frameId, 'loaded');
    if(selectionIframe.ready && controlIframe.ready) {
      Log.debug('all-iframe-loaded');
      const ev = new CustomEvent('all-iframe-loaded');
      document.dispatchEvent(ev);
    }
  }


  function initializeIframe(src) {
    let el = document.createElement("iframe");
    el.src = src;
    el.style.zIndex = "99999999999";
    el.style.border = "none";
    el.style.top = "0";
    el.style.left = "0";
    el.style.margin = "0";
    el.style.width = '100%';
    el.style.clip = "auto";
    el.scrolling = "no";
    el.style.setProperty("background-color", "transparent");
    return el;
  }

  // append UI layers
  function append(){
    remove();
    selectionIframe.append();
    controlIframe.append();
    Log.debug("UI appened");
  }

  // remove UI layer friendly
  function removeFriendly(){
    if(controlIframe.ready) {
      sendFrameMsgToControl('destroy');
    }
    if(selectionIframe.ready) {
      sendFrameMsgToSelection('destroy');
    }
    state.currElem = null;
    Log.debug("UI remove friendly");
  }

  // remove UI layers
  function remove(){
    controlIframe.remove();
    selectionIframe.remove();
    state.currElem = null;
    Log.debug("UI remove");
  }


  function updateFrameSize(frame){
    if(frame){
      const height = Math.max(
        document.documentElement.clientHeight,
        document.body.clientHeight,
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      frame.style.height = height + 'px';
    }
    return frame;
  }

  function windowSizeChanged(){
    if(selectionIframe.element){
      selectionIframe.element = updateFrameSize(selectionIframe.element);
      if(state.clippingState === 'selecting' && state.currElem){
        drawSelectingStyle(state.currElem);
      }
      if(state.clippingState === 'selected' && state.currElem){
        drawSelectedStyle(state.currElem);
      }
    }
  }

  function mouseMove(msg) {
    try {
      const elem = getElementFromPoint(msg.x, msg.y);
      if(['HTML'].indexOf(elem.tagName.toUpperCase()) > -1) {
        return;
      }
      if(state.currElem && state.currElem == elem){
        // event trigger in same element
        return;
      }
      state.currElem = elem;
      drawSelectingStyle(elem);
    } catch(e) {
      Log.error(e);
    }
  }

  function isEventInCurrElem(msg){
    if(state.currElem){
      return isPointInElem({x: msg.x, y: msg.y}, state.currElem);
    } else {
      return false;
    }
  }

  // @param {Object} point - {:x, :y} relative to viewport.
  function isPointInElem(point, elem) {
    // calculate x and y that relative to webpage.
    const x = window.scrollX + point.x;
    const y = window.scrollY + point.y;
    const box = getBox(elem);
    return (
       box.x <= x && x <= box.x + box.w
    && box.y <= y && y <= box.y + box.h
    );
  }

  /*
   *  x => x relative to page
   *  y => y relative to page
   *  w => width of elem box
   *  h => height of elem box
   */
  function getBox(elem){
    const box = elem.getBoundingClientRect();
    return {
      x: window.scrollX + box.left,
      y: window.scrollY + box.top,
      w: box.width,
      h: box.height
    }
  }


  // x, y relative to viewport.
  function getElementFromPoint(x, y) {
    selectionIframe.element.style.pointerEvents = 'none';
    controlIframe.element.style.pointerEvents = 'none';
    let el;
    try {
      el = document.elementFromPoint(x, y);
      el = getOutermostWrapper(el);
    } finally {
      selectionIframe.element.style.pointerEvents = '';
      controlIframe.element.style.pointerEvents = '';
    }
    return el;
  }


  // TODO changeNameHere
  function cancelForm(msg){
    disable();
    remove();
  }

  function hideForm(){
    sendFrameMsgToControl('hideForm');
  }
  function setStateIdle(){
    state.clippingState = 'idle';
    sendFrameMsgToControl('setStateIdle');
    dispatchMxEvent('idle');
  }
  function setStateSelecting(){
    state.clippingState = 'selecting';
    sendFrameMsgToControl('setStateSelecting');
    dispatchMxEvent('selecting');
  }
  function setStateSelected(){
    state.clippingState = 'selected';
    sendFrameMsgToControl('setStateSelected');
    dispatchMxEvent('selected');
  }
  function setStateConfirmed(){
    state.clippingState = 'confirmed';
    sendFrameMsgToControl('setStateConfirmed');
    dispatchMxEvent('confirmed');
  }
  function setStateClipping(){
    state.clippingState = 'clipping';
    sendFrameMsgToControl('setStateClipping');
    dispatchMxEvent('clipping');
  }
  function drawSelectingStyle(elem){
    sendFrameMsgToSelection('drawRect', {box: getBox(elem), color: 'red'});
  }
  function drawSelectedStyle(elem){
    sendFrameMsgToSelection('drawRect', {box: getBox(elem), color: 'green'});
  }
  function eraseHigtlightStyle(){
    sendFrameMsgToSelection('eraseRect');
  }

  function sendFrameMsgToControl(type, msg) {
    FrameMsg.send({to: controlIframe.id, type: type, msg: (msg || {})});
  }

  function sendFrameMsgToSelection(type, msg) {
    FrameMsg.send({to: selectionIframe.id, type: type, msg: (msg || {})});
  }

  function dispatchMxEvent(name, data) {
    MxWcEvent.dispatchInternal(name, data);
    MxWcEvent.broadcastInternal(name, data);
    if (state.config.communicateWithThirdParty) {
      MxWcEvent.dispatchPublic(name, data);
      MxWcEvent.broadcastPublic(name, data);
    }
  }

  // ----------------------------
  function entryClick(e){
    if(state.clippingState === 'idle'){
      listenFrameMsg();
      T.bindOnce(document, 'all-iframe-loaded', enable)
      append();
    }else{
      if(state.clippingState !== 'clipping') {
        ignoreFrameMsg();
        disable();
        remove();
      }
    }
  }

  function listenFrameMsg(){
    const extFrameOrigin = (new URL(ExtApi.getURL('/'))).origin;
    FrameMsg.init({
      id: 'top',
      origin: window.location.origin,
      allowOrigins: [extFrameOrigin]
    })
    FrameMsg.addListener('mousemove'  , mouseMove);
    FrameMsg.addListener('click'      , clickHandler);
    FrameMsg.addListener('pressEsc'   , pressEsc);
    FrameMsg.addListener('pressEnter' , pressEnter);
    FrameMsg.addListener('pressDelete' , pressDelete);
    FrameMsg.addListener('pressLeft'  , pressLeft);
    FrameMsg.addListener('pressUp'    , pressUp);
    FrameMsg.addListener('pressRight' , pressRight);
    FrameMsg.addListener('pressDown'  , pressDown);
    FrameMsg.addListener('clickSelectedArea', clickSelectedArea);
    FrameMsg.addListener('startClip'  , startClip);
    FrameMsg.addListener('entryClick' , entryClick);
    FrameMsg.addListener('cancelForm' , cancelForm);
    FrameMsg.addListener('frame.control.removeMe', function(msg) { controlIframe.remove(); });
    FrameMsg.addListener('frame.selection.removeMe', function(msg) { selectionIframe.remove(); });
    console.log('listenFrameMsg');
  }

  function startClip(msg){
    MxWcHandler.isReady('config.clippingHandler')
    .then(function(result) {
      const {ok, config, message} = result;
      if(ok) {
        eraseHigtlightStyle();
        msg.elem = state.currElem;
        setStateClipping();
        if (config.rememberSelection) {
          MxWcSelectionMain.save(state.currElem, state.deletedElems);
        }
        MxWcSave.save(msg, config);
      } else {
        Notify.error(message);
        ignoreFrameMsg();
        disable();
        remove();
      }
    });
  }


  function ignoreFrameMsg(){
    FrameMsg.clearListener();
  }

  function enable(){
    bindListener();
    setStateSelecting();
  }

  function disable(){
    hideForm();
    unbindListener();
    setStateIdle();
  }

  function clickSelectedArea(msg){
    if(state.currElem){
      toggleScrollY(state.currElem);
    }
  }

  function switchSelected(fromElem, toElem){
    if(fromElem){
      eraseHigtlightStyle();
    }
    if(toElem){
      drawSelectedStyle(toElem);

      if(fromElem){
        // 根据前一个选中确认要滚动到顶部还是底部
        const box = fromElem.getBoundingClientRect();
        if(box.top >= 0){
          scrollToElem(toElem, 'top');
        }else{
          scrollToElem(toElem, 'bottom');
        }
      }else{
        scrollToElem(toElem, 'top');
      }
      if(state.currElem != toElem){
        state.currElem = toElem;
      }
    }
  }

  function toggleScrollY(elem){
    const box = elem.getBoundingClientRect();
    const visibleHeight = window.innerHeight;
    if(Math.round(box.top + box.height) > visibleHeight){
      scrollToElem(elem, 'bottom');
    }else{
      scrollToElem(elem, 'top');
    }
  }

  /*
   * @param {string} mode - 'top' or 'bottom'
   */
  function scrollToElem(elem, mode){
    const box = elem.getBoundingClientRect();
    const x = window.scrollX + box.left;
    if(mode === 'top'){
      const y = window.scrollY + box.top;
      window.scrollTo(x, Math.max(0, y-120));
    }else{
      const y = window.scrollY + box.top + box.height;
      window.scrollTo(x, Math.max(0, y-400));
    }
  }

  function bindListener(){
    sendFrameMsgToControl('bindListener');
  };

  function unbindListener(){
    sendFrameMsgToControl('unbindListener');
    eraseHigtlightStyle();
  };

  function clickHandler(msg){
    if(isEventInCurrElem(msg)){
      if(state.clippingState === 'selecting'){
        selectedTarget(state.currElem);
        return;
      }
      if(state.clippingState === 'selected'){
        clickSelectedArea(msg);
      }
    }
  }

  const MxWc = {}
  MxWc.selector = {
    clearStack: function(){
      if(this.stack){
        this.stack.clear();
      }else{
        this.stack = T.createStack();
      }
    }
  }


  function pressEsc(msg){
    if(state.clippingState === 'selected'){
      Log.debug('back');
      // 选中状态, 退回可选择状态
      disable();
      enable();
      return;
    }
    if(state.clippingState === 'selecting'){
      disable();
      remove();
    }
  }

  function pressEnter(msg){
    if(state.clippingState === 'selecting' && state.currElem){
      selectedTarget(state.currElem);
      return;
    }
    if(state.clippingState === 'selected'){
      MxWcHandler.isReady('config.clippingHandler')
      .then((result) => {
        const {ok, message, handlerInfo, config} = result;
        if(ok) {
          const params = Object.assign({
            handlerInfo: handlerInfo, config: config
          }, getFormInputs(msg));
          sendFrameMsgToControl('showForm', params);
        } else {
          Notify.error(message);
          ignoreFrameMsg();
          disable();
          remove();
        }
      });
    }
  }

  function pressDelete(msg) {
    if(state.clippingState === 'selected'){
      const elem = state.currElem;
      state.deletedElems.push(elem);
      // FIXME
      elem.style.display = 'none';
      disable();
      enable();
      return;
    }
  }

  function pressLeft(msg){
    if(state.clippingState === 'selected'){
      const pElem = getOutermostWrapper(state.currElem.parentElement);
      if(['HTML'].indexOf(pElem.tagName.toUpperCase()) < 0){
        MxWc.selector.stack.push(state.currElem);
        switchSelected(state.currElem, pElem);
      }
    }
  }


  function pressRight(msg){
    if(state.clippingState === 'selected'){
      if(MxWc.selector.stack.isEmpty()){
        let cElem = state.currElem.children[0];
        while(cElem && (isOnBlackList(cElem) || isBoxSizeEq(state.currElem, cElem))){
          cElem = cElem.children[0];
        }
        if(cElem){
          MxWc.selector.clearStack();
          MxWc.selector.stack.push(cElem);
          switchSelected(state.currElem, cElem);
        }
      }else{
        let cElem = MxWc.selector.stack.pop();
        switchSelected(state.currElem, cElem);
      }
    }
  }

  function pressUp(msg){
    if(state.clippingState === 'selected'){
      let prevElem = state.currElem.previousElementSibling;
      while(prevElem && isOnBlackList(prevElem)){
        prevElem = prevElem.previousElementSibling;
      }
      if(prevElem){
        MxWc.selector.clearStack();
        switchSelected(state.currElem, prevElem);
      }
    }
  }


  function pressDown(msg){
    if(state.clippingState === 'selected'){
      let nextElem = state.currElem.nextElementSibling;
      while(nextElem && isOnBlackList(nextElem)){
        nextElem = nextElem.nextElementSibling;
      }
      if(nextElem){
        MxWc.selector.clearStack();
        switchSelected(state.currElem, nextElem);
      }
    }
  }

  function getOutermostWrapper(elem){
    if(['HTML', 'BODY'].indexOf(elem.tagName.toUpperCase()) > 0){ return elem }
    const pElem = elem.parentElement;
    if(isBoxSizeEq(elem, pElem) && !isElemHasVisibleSibling(elem) || isIndivisible(elem, pElem)){
      return getOutermostWrapper(pElem);
    } else {
      return elem;
    }
  }

  function isElemHasVisibleSibling(elem) {
    const children = elem.parentNode.children;
    for(let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child !== elem && T.isElemVisible(window, child)) {
        return true;
      }
    }
    return false;
  }

  function isBoxSizeEq(elemA, elemB) {
    if(elemA && elemB){
      const boxA = elemA.getBoundingClientRect();
      const boxB = elemB.getBoundingClientRect();
      return boxA.width === boxB.width && boxA.height === boxB.height;
    } else {
      return false;
    }
  }

  function isIndivisible(elem, pElem) {
    const ANY = '___ANY___';
    if(elem && pElem) {
      return [
        ['CODE', 'PRE'],
        ['PRE', 'CODE'],
        ['THEAD', 'TABLE'],
        ['TBODY', 'TABLE'],
        [ANY, 'DETAILS'],
      ].some((p) => {
        return (p[0] === ANY || elem.tagName.toUpperCase() === p[0]) && pElem.tagName.toUpperCase() === p[1]
      })
    } else {
      return false;
    }
  }


  function isOnBlackList(elem){
    const blackList = ["SCRIPT", "STYLE", "TEMPLATE"];
    return (blackList.indexOf(elem.tagName.toUpperCase()) > -1
      || elem.tagName.toUpperCase() === 'IFRAME' && T.isExtensionUrl(elem.src)
      || elem.getBoundingClientRect().height === 0
      || elem.innerText.trim().length === 0
    )
  }

  const selectedTarget = function(target){
    sendFrameMsgToControl('unbindMouseMove');
    switchSelected(null, target);
    MxWc.selector.clearStack();
    setStateSelected();
  }

  // msg: {:clipId}
  function clippingSaveStarted(msg) {
    sendFrameMsgToControl('setSavingStateStarted', msg);
  }

  // msg: {:clipId, :finished, :total}
  function clippingSaveProgress(msg) {
    sendFrameMsgToControl('setSavingStateProgress', msg);
  }

  // msg: clippingResult
  function clippingSaveCompleted(msg) {
    sendFrameMsgToControl('setSavingStateCompleted', msg);
    setTimeout(function(){
      disable();
      removeFriendly();
    }, 500);
  }

  /*
   * 3rd party interface
   */
  function focusElem(elem, callback){
    if(state.clippingState === 'idle') {
      Log.debug("[focus] State Idle...");
      entryClick({});
    }
    state.currElem = getOutermostWrapper(elem);
    if(selectionIframe.ready && controlIframe.ready) {
      Log.debug("[focus] Iframe Ready...");
      selectedTarget(state.currElem);
      if(callback){ callback()}
    } else {
      Log.debug("[focus] Iframe Loading...");
      const allIframeLoad = function(e){
        selectedTarget(state.currElem);
        if(callback){ callback()}
        T.unbind(document, 'all-iframe-loaded', allIframeLoad);
      }
      T.bind(document, 'all-iframe-loaded', allIframeLoad);
    }
  }

  /*
   * 3rd party interface
   * options: {:title, :category, :tagstr}
   */
  function confirmElem(elem, options){
    focusElem(elem, function(){
      pressEnter(options);
    });
  }

  /*
   * 3rd party interface
   * options: {:title, :category, :tagstr}
   */
  function clipElem(elem, options){
    focusElem(elem, function(){
      startClip(getFormInputs(options));
    });
  }

  /*
   * 3rd party interface
   * options: {:title, :category, :tagstr}
   */
  state.formInputs = {};
  function setFormInputs(options) {
    state.formInputs = options;
  }

  function getFormInputs(options) {
    const inputs = {
      title    : (options.title    || state.formInputs.title    || document.title),
      category : (options.category || state.formInputs.category || ""),
      tagstr   : (options.tagstr   || state.formInputs.tagstr   || "")
    };
    setFormInputs({});
    return inputs;
  }

  function init(config) {
    state.config = config;
  }

  return {
    init: init,
    remove: remove,
    entryClick: entryClick,
    windowSizeChanged: windowSizeChanged,

    clippingSaveStarted: clippingSaveStarted,
    clippingSaveProgress: clippingSaveProgress,
    clippingSaveCompleted: clippingSaveCompleted,

    // 3rd party interface
    focusElem: focusElem,
    confirmElem: confirmElem,
    clipElem: clipElem,
    setFormInputs: setFormInputs,
  }
});
