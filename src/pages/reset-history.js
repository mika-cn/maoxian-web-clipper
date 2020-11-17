"use strict";

import I18N       from '../js/lib/translation.js';
import T          from '../js/lib/tool.js';
import ExtMsg     from '../js/lib/ext-msg.js';
import MxWcConfig from '../js/lib/config.js';
import MxWcLink   from '../js/lib/link.js';

const state = {};

function initUI() {
  MxWcConfig.load().then((config) => {
    const value = I18N.t('current-storage-path-value').replace(/\$ROOT-FOLDER/g, config.rootFolder);
    T.setHtml('#current-storage-path-value', value);
  });
}

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
  MxWcConfig.load().then((config) => {
    const folder = T.findElem("myInput");
    const selector = T.queryElem(".selector");
    selector.style.display = "none";
    showHint(I18N.t('init.download-folder'));
    ExtMsg.sendToBackground({type: 'init.downloadFolder'});
    // behavior of chrome is so strange. file.webkitRelativePath
    state.worker.postMessage({
      files: folder.files,
      rootFolder: config.rootFolder,
    });
  });
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
    return showHint(I18N.t('processing'));
  }
  if(msg.type === "resetCompleted"){
    ExtMsg.sendToBackground({type: 'generate.clipping.js.if-need'});
    const pageUrl = MxWcLink.get('extPage.history');
    ExtMsg.sendToPage({target: 'history', type: 'history.reseted'}, pageUrl)
    setTimeout(function(){ window.close() }, 3000);
    return showHint(I18N.t('completed'));
  }
  if(msg.type.startsWith('reset.')){
    ExtMsg.sendToBackground(msg);
    let hint = "";
    switch(msg.type){
      case "reset.clips":
        hint = I18N.t('reset-clip-history-success').replace('$n', msg.body.length);
        break;
      case "reset.categories":
        hint = I18N.t('reset-category-success').replace('$n', msg.body.length);
        break;
      case "reset.tags":
        hint = I18N.t('reset-tag-success').replace('$n', msg.body.length);
        break;
    }
    showHint(hint);
  }
}

function init(){
  initUI();
  I18N.i18nPage();
  bindListener();
  MxWcLink.listen(document.body);
  state.worker = new Worker('reset-history-worker.js');
  state.worker.onmessage = handlerWorkerMessage;
}

init();
