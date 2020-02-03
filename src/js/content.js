;(function (root, factory) {
  factory(
    root.MxWcLog,
    root.MxWcTool,
    root.MxWcExtMsg,
    root.MxWcEvent,
    root.MxWcConfig,
    root.MxWcLink,
    root.MxWcSelectionMain,
    root.MxWcUI,
  );
})(this, function(Log, T, ExtMsg, MxWcEvent,
    MxWcConfig, MxWcLink, MxWcSelectionMain, UI, undefined) {
  "use strict";

  const state = {
    config: null
  };

  function listenMessage(){
    // ExtMsg has initialized in content-frame.js
    ExtMsg.listen(function(msg){
      return new Promise(function(resolve, reject){
        switch(msg.type){
          case 'icon.click':
            window.focus();
            UI.entryClick({});
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
    MxWcEvent.listenInternal('focus-elem', focusElem);
    MxWcEvent.listenInternal('confirm-elem', confirmElem);
    MxWcEvent.listenInternal('clip-elem', clipElem);
    Log.debug('listen internal message');
  }

  /*
   * ThirdParty: userScript or other Extension.
   */
  function listenTpMessage(){
    MxWcEvent.listenPublic('focus-elem', focusElem);
    MxWcEvent.listenPublic('confirm-elem', confirmElem);
    MxWcEvent.listenPublic('clip-elem', clipElem);
    MxWcEvent.listenPublic('set-form-inputs', setFormInputs);
    Log.debug('listenTpMessage');
  }

  function tellTpWeAreReady(){
    setTimeout(function(){
      Log.debug("tellTpWeAreReady");
      MxWcEvent.dispatchPublic('ready');
    }, 0);
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

  function focusElem(e) {
    const msg = MxWcEvent.getData(e);
    queryElem(msg, (elem) => {
      UI.focusElem(elem)
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

  /*
   * Hotkey `c` listener
   */
  function toggleSwitch(e){
    if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey){ return }
    // 67 keyCode of 'c'
    if(e.keyCode != 67){ return }
    if(e.target.tagName.toUpperCase() === 'BODY'){
      UI.entryClick(e);
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

});
