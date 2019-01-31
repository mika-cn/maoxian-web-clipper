(function(){

  function listenMessage(){
    ExtApi.addMessageListener(function(msg){
      return new Promise(function(resolve, reject){
        switch(msg.type){
          case 'icon.click':
            window.focus();
            UI.entryClick({});
            break;
          case 'download.completed':
            UI.downloadCompleted();
            break;
          case 'page_content.changed':
            pageContentChanged();
            break;
          default: break;
        }
        resolve();
      });
    });
  }

  /*
   * ThirdParty: userScript or other Extension.
   */
  function listenTpMessage(){
    T.bindOnce(document, 'mx-wc.focus-elem', focusElem);
    T.bindOnce(document, 'mx-wc.confirm-elem', confirmElem);
    T.bindOnce(document, 'mx-wc.clip-elem', clipElem);
    T.bindOnce(document, 'mx-wc.set-form-inputs', setFormInputs);
    Log.debug('listenTpMessage');
  }

  function tellTpWeAreReady(){
    document.dispatchEvent(new CustomEvent('mx-wc.ready'))
  }

  function focusElem(e) {
    const msg = parseMsgFromTpEvent(e);
    queryElem(msg, (elem) => {
      UI.focusElem(elem)
    });
  }

  function confirmElem(e) {
    const msg = parseMsgFromTpEvent(e);
    queryElem(msg, (elem) => {
      UI.confirmElem(elem, (msg.options || {}));
    });
  }

  function clipElem(e) {
    const msg = parseMsgFromTpEvent(e);
    queryElem(msg, (elem) => {
      UI.clipElem(elem, (msg.options || {}));
    });
  }

  function setFormInputs(e) {
    const msg = parseMsgFromTpEvent(e);
    UI.setFormInputs(msg.options || {});
  }

  function parseMsgFromTpEvent(e) {
    if(typeof e.detail === 'string') {
      // Firefox(Gecko) restict(for secure reason) e.detail when it is a custom object.
      // We use json string to walk around.
      return JSON.parse(e.detail);
    } else {
      // Ensure compatible with old version(mx-wc-tool.js)
      // e.detail is a custom object.
      return e.detail;
    }
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


  function pageContentChanged(){
    setTimeout(function(){
      Log.debug('page content changed');
      UI.windowSizeChanged();
    }, 200);
  }


  /*
   * Hotkey `c` listener
   */
  function toggleSwitch(e){
    if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey){ return }
    // 67 keyCode of 'c'
    if(e.keyCode != 67){ return }
    if(e.target.tagName === 'BODY'){
      UI.entryClick(e);
    }else{
      // console.log(e.target.tagName);
    }
  }

  function initialize(){
    MxWcConfig.load()
      .then((config) => {
        if(config.enableSwitchHotkey) {
          T.bindOnce(document, "keydown", toggleSwitch);
        }
        T.bind(window, 'resize', function(e){
          UI.windowSizeChanged(e);
        });
        Log.debug("content init...");
      });
  }

  function run(){
    if(document){
      const xml = new XMLSerializer().serializeToString(document).trim();
      if(xml.match(/^<\?xml/i)){
        /* page is rss/atom ... */
      }else{
        setTimeout(() => {
          initialize();
          listenMessage();
          listenPopState();
          listenTpMessage();
          tellTpWeAreReady();
        }, 0)
      }
    }
  }

  run();

})();

