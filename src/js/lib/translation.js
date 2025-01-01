"use strict";

import ExtApi  from './ext-api.js';
const DEFAULT_LOCALE = 'en';

// code => values
let dict = {'en': {}, 'zh-CN': {}};
let selectedValues = undefined;

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
  if (selectedValues[key]) {
    return selectedValues[key]
  }
  return key;
}


function translateAndSubstitude(key, change) {
  const regExp = /\$\{([^\$\}]+)\}/mg;
  const it = translate(key);
  return it.replace(regExp, (match, key) => {
    if (change.hasOwnProperty(key)) {
      return change[key];
    } else {
      return key;
    }
  });
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

function init(localeObject, locale) {
  keyMap.forEach(([code, variableName]) => {
    if (localeObject.hasOwnProperty(variableName)) {
      dict[code] = localeObject[variableName];
    } else {
      console.error("locale values missing: ", code);
      dict[code] = {};
    }
  });
  selectLocale(locale || ExtApi.getLocale());
  listen();
}


export default {
  init: init,
  t: translate,
  s: translateAndSubstitude,
  i18nPage: i18nPage,
}
