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
      UI.pageContentChanged();
    }, 200);
  }


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
        }, 0)
      }
    }
  }

  run();

})();

