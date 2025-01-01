"use strict";

import localeEn    from '../_locales/en/sync-user-scripts.js';
import localeZhCN  from '../_locales/zh_CN/sync-user-scripts.js';
import I18N       from '../js/lib/translation.js';
import T          from '../js/lib/tool.js';
import ExtMsg     from '../js/lib/ext-msg.js';
import MxWcConfig from '../js/lib/config.js';
import Storage    from '../js/lib/storage.js';
import MxWcLink   from '../js/lib/link.js';
import UserScriptParser from '../js/user-script/parser.js';

const state = {};

function initUI() { }

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
  parseFiles(folder.files).then(removeOldData).then(saveScripts).then((length) => {
    showHint(I18N.s('done', {n: length}));
    const pageUrl = MxWcLink.get('extPage.setting');
    ExtMsg.sendToPage({target: 'setting', type: 'refresh-user-scripts'}, pageUrl)
    setTimeout(window.close, 3000);
    showHint(I18N.t('close-page'));
  });
}


async function parseFiles(files) {
  const scripts = [];
  for (const file of files) {
    if ( file.type == 'text/javascript'
      || file.type == 'application/x-javascript'
    ) {
      const text = await T.readTextFile(file);
      const r = UserScriptParser.parseSourceCode(text);
      if (r.ok) { scripts.push(r.script) }
    }
  }
  return scripts;
}


async function removeOldData(scripts) {
  const filter = T.prefixFilter('user-script.', true);
  await Storage.removeByFilter(filter)
  return scripts;
}

async function saveScripts(scripts) {
  const items = [];
  for (const it of scripts) {
    const meta = T.sliceObj(it, ['name', 'version', 'author', 'description']);
    const key = ['user-script', 'script', it.name].join('.');
    await Storage.set(key, it);
    items.push(meta);
  }

  const scriptsKey = 'user-script.scripts';
  await Storage.set(scriptsKey, items);
  return scripts.length;
}


function hideResetBtn(){
  const btn = T.findElem("reset-btn");
  btn.style.display = 'none';
}

function showResetBtn(){
  const btn = T.findElem("reset-btn");
  btn.style.display = 'inline-block';
}

function init(){
  I18N.init({localeEn, localeZhCN});
  initUI();
  I18N.i18nPage();
  bindListener();
  MxWcLink.listen(document.body);
}

init();
