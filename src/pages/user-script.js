"use strict";

import localeEn    from '../_locales/en/user-script.js';
import localeZhCN  from '../_locales/zh_CN/user-script.js';
import ENV     from '../js/env.js';
import T       from '../js/lib/tool.js';
import I18N    from '../js/lib/translation.js';
import Storage from '../js/lib/storage.js';

async function init() {
  const currUrl = new URL(window.location.href);
  const name = currUrl.searchParams.get('name');
  if (name) {
    const key = ['user-script.script', name].join('.');
    const script = await Storage.get(key);
    if (script) {
      document.title = script.name;
      renderUserScript(script);
    } else {
      // illegal name
    }
  } else {
    // illegal name
  }
}


function renderUserScript(it) {
  console.debug(it);
  const elem = T.findElem('user-script');
  const tpl = T.findElem('user-script-tpl').innerHTML;
  const html = T.renderTemplate(tpl, {
    name: it.name,
    version: it.version,
    author: it.author,
    description: (it.description || "")
  });
  T.setHtml(elem, html);
  const codeElem = T.findElem('source-code');
  codeElem.textContent = it.code;
}


init();
I18N.init({localeEn, localeZhCN});
I18N.i18nPage();
