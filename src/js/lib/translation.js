"use strict";

import ExtApi  from './ext-api.js';
const DEFAULT_LOCALE = 'en';

// code => values
let dict = {'en': [], 'zh-CN': []};
let selectedValues = undefined;

function addValues(code, values) {
  if (!dict.hasOwnProperty(code)) {
    dict[code] = [];
  }
  dict[code].unshift(values);
}

function selectLocale(locale) {
  if (dict.hasOwnProperty(locale)) {
    selectedValues = dict[locale];
  } else {
    selectedValues = dict[DEFAULT_LOCALE];
  }
}

//
// all parts will join by '.'
//
// Usage:
//   t(key)
//   t(keyPart1, keyPart2, ..keyPartN)
function translate(...parts) {
  const key = parts.join('.');
  for (const it of selectedValues) {
    if (it[key]) { return it[key] }
  }
  return key;
}

// FIXME
function translateAndSubstitude(key, replacement) {
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


const keyMap = [
  ['en'   , 'localeEn'],
  ['zh-CN', 'localeZhCN'],
];

function init(localeObject) {
  keyMap.forEach(([code, variableName]) => {
    if (localeObject.hasOwnProperty(variableName)) {
      addValues(code, localeObject[variableName]);
    } else {
      console.error("locale values missing: ", code);
      addValues(code, {});
    }
  });
  selectLocale(ExtApi.getLocale());
  listen();
}


export default {
  init: init,
  t: translate,
  s: translateAndSubstitude,
  i18nPage: i18nPage,
}
