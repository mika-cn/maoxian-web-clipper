
"use strict";

(function(){
  const state = {};

  function bindListener(){
    const folder = T.findElem("myInput");
    const btn = T.findElem("reset-btn");
    folder.onchange = showResetBtn;
    btn.onclick = reset;
  }

  function showHint(msg){
    const elem = T.queryElem(".hint");
    const html = elem.innerHTML + ("<br />" + msg);
    T.setHtml(elem, html);
  }

  function reset(){
    const folder = T.findElem("myInput");
    const selector = T.queryElem(".selector");
    selector.style.display = "none";
    showHint(t('init.download-folder'));
    ExtApi.sendMessageToBackground({type: 'init.downloadFold'});
    state.worker.postMessage(folder.files);
  }

  function hideResetBtn(){
    const btn = T.findElem("reset-btn");
    btn.style.display = 'none';
  }

  function showResetBtn(){
    const btn = T.findElem("reset-btn");
    btn.style.display = 'inline-block';
  }

  function handlerWorkerMessage(e){
    const msg = e.data;
    if(msg.type === "resetProcessing"){
      return showHint(t('reset.processing'));
    }
    if(msg.type === "resetCompleted"){
      ExtApi.sendMessageToBackground({type: 'generate.clipping.js.if-need'});
      const pageUrl = MxWcLink.get('extPage.history');
      ExtApi.sendMessageToExtPage({type: 'history.reseted'}, pageUrl)
      //setTimeout(function(){ window.close() }, 3000);
      return showHint(t('reset.completed'));
    }
    if(msg.type.startsWith('reset.')){
      ExtApi.sendMessageToBackground(msg);
      let hint = "";
      switch(msg.type){
        case "reset.clips":
          hint = t('reset.clip-history-success').replace('$n', msg.body.length);
          break;
        case "reset.categories":
          hint = t('reset.category-success').replace('$n', msg.body.length);
          break;
        case "reset.tags":
          hint = t('reset.tag-success').replace('$n', msg.body.length);
          break;
      }
      showHint(hint);
    }
  }

  function init(){
    i18nPage();
    bindListener();
    state.worker = new Worker('reset-history-worker.js');
    state.worker.onmessage = handlerWorkerMessage;
  }

  init();
})();
