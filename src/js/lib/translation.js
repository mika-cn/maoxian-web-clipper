"use strict";

import ExtApi  from './ext-api.js';

const I18nLib = i18n;
const DEFAULT_LOCALE = 'en';
let locale = DEFAULT_LOCALE;
const I18N_DICT = {'en': MxWcI18N_en, 'zh-CN': MxWcI18N_zh_CN};

function initTranslator(locale){
  const dict = I18N_DICT[locale]
  if(dict){
    I18nLib.translator.add(dict);
  }else{
    initTranslator(DEFAULT_LOCALE);
  }
}

function append(values) {
  I18nLib.translator.add({values});
}

//
// all parts will join by '.'
//
// Usage:
//   t(key)
//   t(keyPart1, keyPart2, ..keyPartN)
function translate(...parts) {
  return I18nLib.translator.translate(parts.join('.'));
}

function i18nPage(contextNode){
  const iterate = function(attr, action) {
    [].forEach.call((contextNode || document).querySelectorAll('['+attr+']'), function(elem){
      const value = elem.getAttribute(attr);
      action(elem, value)
    });
  }
  iterate('i18n', function(elem, value) {
    if(elem.innerHTML === '' && value) {
      elem.innerHTML = translate(value);
    }
  });
  iterate('i18n-attr', function(elem, value) {
    const [attr, key] = value.split(':');
    elem.setAttribute(attr, translate(key));
  });
}

function listen() {
  try {
    document.addEventListener('___.mx-wc.page.changed', function(e) {
      const detail = JSON.parse(e.detail);
      if(detail.selector !== '') {
        const contextNode = document.querySelector(detail.selector);
        i18nPage(contextNode);
      } else {
        i18nPage();
      }
    });
  } catch(e) {
    // not running in browser;
  }
}

function init() {
  locale = ExtApi.getLocale();
  initTranslator(locale);
  listen();
}

init();

export default {
  DEFAULT_LOCALE: DEFAULT_LOCALE,
  locale: locale,
  append: append,
  t: translate,
  i18nPage: i18nPage,
}
