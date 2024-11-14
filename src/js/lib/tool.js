"use strict";

// Tool

import mime from './mime.js';

const T = {};

T.defineEnum = function(names, start = 1) {
  return Object.freeze(
    names.reduce((obj, name, index) => {
      obj[name] = index + start;
      return obj;
    }, {})
  );
}

T.isBlankStr = function(str) {
  return (/^\s*$/).test(str);
}

T.toJsVariableName = function(str) {
  const it = T.capitalize(str);
  const [char1, rest] = [
    it.substr(0, 1),
    it.substr(1)
  ];
  return char1.toLowerCase() + rest;
}

T.capitalize1st = function(str) {
  return str[0].toUpperCase() + str.substr(1);
}

T.capitalize = function(str) {
  const arr = str.split(/[-_]+/)
  return arr.map((it) => {
    const [char1, rest] = [
      it.substr(0, 1),
      it.substr(1)
    ];
    return char1.toUpperCase() + rest.toLowerCase();
  }).join('');
}

T.deCapitalize = function(str, sep = '-') {
  const sepCharCode = sep.charCodeAt(0),
    ints = [];
  for(let i=0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if(65 <= charCode && charCode <= 90) {
      if(i > 0) { ints.push(sepCharCode) }
      ints.push(charCode + 32);
    } else {
      ints.push(charCode);
    }
  }
  return String.fromCharCode(...ints);
}

T.splitByFirstSeparator = function(str, sep) {
  const idx = str.indexOf(sep);
  if (idx > -1) {
    return [
      str.substring(0, idx),
      str.substring(idx + sep.length)
    ];
  } else {
    return [str, undefined]
  }
}

T.replaceLastMatch = function(str, regExp, replacement) {
  const matches = str.match(regExp);
  if (matches) {
    let i = 0, last = matches.length;
    return str.replace(regExp, (match) => {
      if (++i === last) {
        return replacement;
      } else {
        return match;
      }
    })
  } else {
    return str;
  }
}

T.deleteLastPart = function(str, sep = '.') {
  const arr = str.split(sep);
  arr.pop();
  return arr.join(sep);
}


T.createId = function() {
  return '' + Math.round(Math.random() * 100000000000);
}

T.eachNonCommentLine = function(text, fn) {
  const lines = text.split(/\n+/);
  const commentRe = /^#/;
  for (const line of lines) {
    const lineText = line.trim();
    if (!lineText.match(commentRe) && lineText !== '') {
      const isBreak = fn(lineText);
      if (isBreak) { break; }
    }
  }
}

// ===============================
// Object
// ===============================
T.sliceObj = function(obj, keys) {
  const r = {};
  for (let i = 0; i < keys.length; i++) {
    r[keys[i]] = obj[keys[i]];
  }
  return r;
}

T.mapObj = function(obj, transfer) {
  const r = [];
  for (let k in obj) { r.push(transfer(k, obj[k])) }
  return r;
}

T.styleObj2Str = function(obj) {
  return T.mapObj(obj, (k, v) => `${k}: ${v}`).join(";");
}


/**
 * A filter can return:
 *   true   => this item will be selected
 *   false  => this item won't be selected
 *   'NEXT' => try next filter
 */
T.sliceArrByFilter = function(arr, ...filters) {
  const r = [];
  if (filters.length == 0) { return r }
  for (const item of arr) {
    for (let i = 0; i < filters.length; i++) {
      const answer = filters[i](item);
      let breakCurrRound = false;
      switch (answer) {
        case true:
          r.push(item);
          breakCurrRound = true;
          break;
        case false:
          breakCurrRound = true;
          break;
        case 'NEXT':
          ; // I don't care, try next filter
      }
      if (breakCurrRound) { break }
    }
  }

  return r;
}


/**
 * A filter can return:
 *   true   => this item will be selected
 *   false  => this item won't be selected
 *   'NEXT' => try next filter
 */
T.sliceObjByFilter = function(obj, ...filters) {
  const r = {};
  if (filters.length == 0) { return r }
  for (const key in obj) {
    const value = obj[key];
    for (let i = 0; i < filters.length; i++) {
      const answer = filters[i](key, value);
      let breakCurrRound = false;
      switch (answer) {
        case true:
          r[key] = value;
          breakCurrRound = true;
          break;
        case false:
          breakCurrRound = true;
          break;
        case 'NEXT':
          ; // I don't care, try next filter
      }
      if (breakCurrRound) { break }
    }
  }
  return r;
}

T.rmAttributeFilter = function(...attrNames) {
  return function(key) {
    return !(attrNames.indexOf(key) > -1)
  }
}

T.attributeFilter = function(attrName, answer) {
  return function(key) {
    return key === attrName ? answer : 'NEXT';
  }
}

T.prefixFilter = function(keyPrefix, answer) {
  return function(key) {
    return key.startsWith(keyPrefix) ? answer : 'NEXT';
  }
}

// ===============================
// DOM relative
// ===============================

T.findElem = function(id, contextNode = document){ return contextNode.querySelector(`#${id}`) }
T.firstElem = function(className, contextNode = document){ return T.queryElem(`.${className}`, contextNode) }
T.queryElem = function(selector, contextNode = document){ return contextNode.querySelector(selector) }
T.queryElems = function(selector, contextNode = document){ return contextNode.querySelectorAll(selector) }

T.setElemValue = function(selector, value) {
  const elem = document.querySelector(selector);
  if (elem) {
    elem.value = value;
  } else {
    console.error(`Could not find elem. selector ${selector}`);
  }
}

T.getElemValue = function(selector) {
  const elem = document.querySelector(selector);
  if (elem) {
    return elem.value;
  } else {
    console.error(`Could not find elem. selector ${selector}`);
  }
}

T.findParentById = function(elem, id) {
  if(elem.parentNode.id === id) {
    return elem.parentNode;
  } else {
    return T.findParentById(elem.parentNode, id);
  }
}


// If image permission is disabled, style.display is 'inline'.
T.isElemVisible = function(win, elem, whiteList = []) {
  if(whiteList.indexOf(elem.tagName.toUpperCase()) > -1) {
    return true
  }

  const style = win.getComputedStyle(elem);
  if(style.display === 'none') {
    return false;
  }

  if(style.visibility === 'hidden'){
    return false
  }

  return true
}

// obj: element or selector
T.setHtml = function(obj, html) {
  let elem = null;
  let selector = "";
  if(typeof obj === 'object') {
    elem = obj;
    if(elem.id) {
      selector = "#" + elem.id;
    } else if(elem.className) {
      selector = "." + elem.className.split(' ').join('.');
    }
  } else {
    selector = obj;
    elem = T.queryElem(obj);
  }
  if(elem){
    elem.innerHTML = html;
    T.emitPageChangedEvent(selector);
  }
}

T.sanitizeSelectorItem = function(selector, win) {
  try {
    const w = win || window;
    return w.CSS.escape(selector);
  } catch(e) {
    // test env
    return selector;
  }
}

T.emitPageChangedEvent = function(selector) {
  const msg = selector ? {selector} : {};
  const json = JSON.stringify(msg);
  const e = new CustomEvent('___.mx-wc.page.changed', {detail: json});
  document.dispatchEvent(e);
}

T.bind = function(elem, evt, fn, useCapture){
  elem.addEventListener(evt, fn, useCapture);
}

T.unbind = function(elem, evt, fn, useCapture){
  elem.removeEventListener(evt, fn, useCapture);
}

T.bindOnce = function(elem, evt, fn, useCapture){
  if (fn.name) {
    T.unbind(elem, evt, fn, useCapture);
    T.bind(elem, evt, fn, useCapture);
  } else {
    const message = `Can not bind anonymous function, trying to bind event: ${evt}`
    throw new Error(message);
  }
}

T.splitStrBySpaceOrComma = function(str) {
  const seperateChars = "\\s,，";
  return T.splitStrBySepChars(str, seperateChars);
}

T.splitStrByComma = function(str) {
  const seperateChars = ",，";
  return T.splitStrBySepChars(str, seperateChars);
}

T.splitStrBySepChars = function (inputStr, sepChars) {
  const headRegExp = new RegExp(`^[\\s${sepChars}]+`);
  const tailRegExp = new RegExp(`[\\s${sepChars}]+$`);
  // trim two ends
  const str = inputStr
    .replace(headRegExp, '')
    .replace(tailRegExp, '');

  if (str.length === 0) {
    return [];
  } else {
    const items = T.map(
      str.split(new RegExp(`[${sepChars}]+`, 'g')),
      function(it){ return it.trim()}
    );
    return T.unique(items);
  }
}

// collection

T.toArray = function(it) {
  if (!it) { return [] }
  if (it.constructor == Array) {
    return it;
  } else {
    return [it];
  }
}

T.unique = function(collection){
  const arr = T.iterable2Array(collection);
  return arr.filter(function(value, index, self) {
    return self.indexOf(value) === index;
  });
}

T.intersection = function(arrA, arrB){
  return arrA.filter(function(n) {
    return arrB.indexOf(n) > -1;
  });
}

T.remove = function(collection, element){
  const index = collection.indexOf(element);
  if(index > -1){
    collection.splice(index, 1);
  }
  return collection
}

T.each = function(collection, fn){
  [].forEach.call(collection, fn);
}
T.map = function(collection, fn){
  const r = [];
  T.each(collection, function(o){
    r.push(fn(o));
  });
  return r;
}

T.iterable2Array = function(collection){
  if(collection.length == 0){ return []}
  return T.map(collection, function(o){return o});
}
T.detect = function(collection, fn){
  return [].find.call(collection, fn);

}
T.select = function(collection, fn){
  const r = []
  T.each(collection, function(o){
    if(fn(o)){ r.push(o) }
  });
  return r;
}
T.include = function(collection, member){
  return collection.indexOf(member) > -1;
}
T.all = function(collection, fn) {
  let r = true;
  for (let i = 0; i < collection.length; i++) {
    const result = fn(collection[i]);
    if(!result) {
      r = false;
      break;
    }
  }
  return r;
}
T.any = function(collection, fn) {
  return [].some.call(collection, fn);
}


T.toJson = function(hash, replacer = null, space = 2) {
  return JSON.stringify(hash, replacer, space);
}

//========== Url ===================

/*
 * file://
 * chrome-extension://
 * moz-extension://
 * chrome://communicator/skin/
 * ...
 * javascript:
 * data:
 * about:
 * mailto:
 * tel:
 * ...
 */
T.newUrl = function(part, base) {
  if ([undefined, null, ''].indexOf(part) > -1) {
    return {isvalid: false, message: 'Empty URL'};
  }
  try {
    const url = new URL(part, base);
    return {isValid: true, url: url};
  } catch(e) {
    return {isValid: false, message: e.message};
  }
}

T.completeUrl = function(part, base) {
  const {isValid, url, message} = T.newUrl(part, base);
  if (isValid) {
    return {isValid: true, url: url.href};
  } else {
    return {isValid: false, message: message}
  }
}

T.isUrlHasFileExtension = function(url) {
  const filename = url.split('?')[0].split('#')[0].split('/').pop();
  return filename.indexOf('.') > -1;
}


T.isFileUrl = function(url){
  if (url.match(/^file:/i)) {
    return true;
  } else {
    return false;
  }
}

T.isBrowserExtensionUrl = function(url){
  if(url.indexOf('://') > -1) {
    const protocol = url.split('://')[0];
    return !!protocol.match(/-extension$/);
  } else {
    return false
  }
}

T.isDataUrl = function(url){
  if (url.match(/^data:/i)) {
    return true;
  } else {
    return false;
  }
}

T.isBlobUrl = function(url){
  if (url.match(/^blob:/i)) {
    return true;
  } else {
    return false;
  }
}

T.isHttpUrl = function(url){
  if (url.match(/^https:/i) || url.match(/^http:/i)) {
    return true;
  } else {
    return false;
  }
}

// Browser built-in pages
T.isBrowserUrl = function(url){
  return ([
    'about:',     /* Firefox */
    'chrome',  /* Chrome or Chromium (chrome-serach://, chrome://) */
    'vivaldi://', /* vivaldi */
  ]).some(function(it){
    return url.startsWith(it);
  });
}


// pageUrl should be a valid url
T.url2Anchor = function(url, pageUrl) {
  const page = T.newUrl(pageUrl);
  if (!page.isValid) { return (url || '') }

  const curr = T.newUrl(url);
  if (!curr.isValid) { return (url || '') }

  if (T.isHttpUrl(url)) {
    const isSamePage = function(urlA, urlB) {
      if(urlA.origin != urlB.origin) return false;
      if(urlA.pathname != urlB.pathname) return false;
      const searchA = new URLSearchParams(urlA.search);
      const searchB = new URLSearchParams(urlB.search);
      searchA.sort();
      searchB.sort();
      return searchA.toString() === searchB.toString();
    }

    if (isSamePage(curr.url, page.url)) {
      if (curr.url.hash != '') {
        return curr.url.hash
      } else if (url.match(/#$/)){
        // empty fragment '#'
        // is used to link to the top of current page.
        return '#';
      } else {
        return url;
      }
    } else {
      return url;
    }
    if (curr.url.hash != '' && isSamePage(curr.url, page.url)) {
      return curr.url.hash;
    } else {
      return url;
    }
  } else {
    // not http url, do nothing
    return url;
  }
}


T.getDoOnceObj = function(){
  return {
    list: new Set(),
    restrict: function(key, action){
      if(!this.list.has(key)){
        this.list.add(key);
        action();
      }
    }
  }
}

T.replaceAll = function(str, subStr, newSubStr){
  const regStr = subStr.replace('?', '\\?');
  return str.replace(new RegExp(regStr, 'mg'), newSubStr);
}


// Note that the output (filename) may contains file extension tail
// @see T.removeFileExtensionTail
T.getUrlFilename = function(urlOrPath){
  const urlBody = urlOrPath.split('?')[0].split('#')[0]
  const lastPart = decodeURI(urlBody).split('/').pop();
  return lastPart;
}


T.getUrlExtension = function(url){
  if (T.isDataUrl(url) || T.isBlobUrl(url)) {
    return ''
  } else {
    return T.getFileExtension(T.removeFileExtensionTail(T.getUrlFilename(url)));
  }
}


T.getFileExtension = function(filename){
  const idx = filename.lastIndexOf('.');
  if (idx > 0) {
    return filename.substring(idx + 1);
  } else {
    // starts with ".", or not contains "."
    return '';
  }
}


// Some stupy libraries use file extension tail
// to represent file properties ( version, width, height ...).
//
// such as:
//   * a-picture.png!large
//   * a-picture.png@400w_200h
//
T.removeFileExtensionTail = function(name) {
  const dotIdx = name.lastIndexOf('.');

  // starts with ".", or not contains "."
  if (dotIdx < 1) { return name; }

  let newName = name;
  const seperators = ['!', '@'];
  seperators.forEach((seperator) => {
    const sepIdx = name.lastIndexOf(seperator);
    if (sepIdx > 0 && dotIdx < sepIdx) {
      newName = newName.substring(0, sepIdx);
    }
  });

  return newName;
}


// return [name, extension]
T.splitFilename = function(filename) {
  const idx = filename.lastIndexOf('.');
  if (idx > 0) {
    return [
      filename.substring(0, idx),
      filename.substring(idx + 1)
    ]
  } else {
    // starts with ".", or not contains "."
    return [filename, null];
  }
}

T.rjustNum = function(num, length){
  let s = num.toString();
  if(s.length >= length){ return s }
  return T.rjustNum('0' + s, length)
}

T.currentTime = function(){
  return T.wrapDate(new Date());
}

// now is an interger return by Date.now().
T.wrapNow = function(now) {
  return T.wrapDate(new Date(now));
}

T.wrapDate = function(date) {
  const tObj = {
    value  : date,
    year   : date.getFullYear(), // why the first call is so slow in node.
    sYear  : date.getFullYear() % 100,
    month  : date.getMonth() + 1,
    day    : date.getDate(),
    hour   : date.getHours(),
    minute : date.getMinutes(),
    second : date.getSeconds(),
    intSec : Math.floor(date/1000),
    intMs  : date / 1
  }

  // sYear => short year
  const s = {
    year: tObj.year.toString(),
    sYear: T.rjustNum(tObj.sYear, 2),
    month: T.rjustNum(tObj.month, 2),
    day: T.rjustNum(tObj.day, 2),
    hour: T.rjustNum(tObj.hour, 2),
    minute: T.rjustNum(tObj.minute, 2),
    second: T.rjustNum(tObj.second, 2),
    intSec: tObj.intSec.toString(),
    intMs: tObj.intMs.toString()
  }

  s['YYYY'] = s.year;
  s['YY'] = s.sYear;
  s['MM'] = s.month;
  s['DD'] = s.day;
  s['dd'] = s.day;
  s['HH'] = s.hour;
  s['mm'] = s.minute;
  s['SS'] = s.second;
  s['ss'] = s.second;
  s['TIME-INTSEC'] = s.intSec;

  tObj.str = s;

  tObj.toString = function(){
    // YYYY-MM-dd HH:mm:ss
    return `${s.year}-${s.month}-${s.day} ${s.hour}:${s.minute}:${s.second}`;
  }

  tObj.date = function() {
    return `${s.year}-${s.month}-${s.day}`;
  }

  tObj.time = function() {
    return `${s.hour}:${s.minute}:${s.second}`;
  }

  tObj.beginingOfDay = function(){
    return `${s.year}-${s.month}-${s.day} 00:00:00`;
  }

  tObj.endOfDay = function(){
    return `${s.year}-${s.month}-${s.day} 23:59:59`;
  }
  return tObj;
}

// @see https://stackoverflow.com/questions/1976007/what-characters-are-forbidden-in-windows-and-linux-directory-names#1976050
// @see https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file
// More strict
T.sanitizeFilename = function(name){

  if (typeof name !== 'string') {
    throw new Error("Filename must be string");
  }

  // Unicode Control codes
  // 0x00-0x1f and 0x80-0x9f
  const regExp_unicodeControlCode = /[\x00-\x1f\x80-\x9f]/g

  // remove "\s" "\." ","
  // Illegal characters on most file systems.
  //   "/", "?", "|", "<", ">", "\", ":", "*", '"'
  const regExp_illegalChars = /[\/\?\|<>\\:\*"]/g

  // Reserved names in Windows: 'CON', 'PRN', 'AUX', 'NUL',
  // 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  // 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  // case-insesitively and with or without filename extensions.
  const regExp_winReservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

  // <space> and "." are not allowed in the end (in the Windows).
  const regExp_winTrailingChars = /[ \.]$/;


  // Reserved names in Unix liked OS
  // ".", ".."
  const regExp_UnixLikedReservedNames = /^\.+$/;

  // clear name string.
  const input = name.trim().replace(regExp_unicodeControlCode, '');
  const replacement = ["invalid-filename", Math.round(Math.random() * 10000)].join('-');

  if (input.match(regExp_winReservedNames) || input.match(regExp_UnixLikedReservedNames)) {
    return replacement;
  }

  // separator
  const s = '-';
  let result = input.replace(regExp_illegalChars, s).replace(regExp_winTrailingChars, s);

  result = result.replace(new RegExp('`', 'g'), s);
  // remember conflict values
  const conflicts = [ /c\+\+/ig ];
  const idxTool = T.createIdxTool();
  const conflictValues = [];

  conflicts.forEach((regExp) => {
    result = result.replace(regExp, (match) => {
      conflictValues.push(match);
      return "`" + idxTool.next() + "`";
    })
  })

  // avoid ugly filename :)
  result = result.replace(/\s/g, s)
    .replace(/,/g, s)
    .replace(/\./g, s)
    .replace(/'/g, s)
    .replace(/#/g, s)
    .replace(/@/g, s)
    .replace(/~/g, s)
    .replace(/!/g, s)
    .replace(/%/g, s)
    .replace(/&/g, s)
    .replace(/\+/g, s)
    .replace(/\?/g, s)
    .replace(/\[/g, s)
    .replace(/\]/g, s)
    .replace(/\(/g, s)
    .replace(/\)/g, s)
    .replace(/\{/g, s)
    .replace(/\}/g, s)

    .replace(/：/g, s)
    .replace(/‘/g, s)
    .replace(/’/g, s)
    .replace(/“/g, s)
    .replace(/”/g, s)
    .replace(/，/g, s)
    .replace(/。/g, s)
    .replace(/！/g, s)
    .replace(/？/g, s)
    .replace(/《/g, s)
    .replace(/》/g, s)
    .replace(/〈/g, s)
    .replace(/〉/g, s)
    .replace(/«/g, s)
    .replace(/»/g, s)
    .replace(/‹/g, s)
    .replace(/›/g, s)
    .replace(/（/g, s)
    .replace(/）/g, s)
    .replace(/「/g, s)
    .replace(/」/g, s)
    .replace(/【/g, s)
    .replace(/】/g, s)
    .replace(/〔/g, s)
    .replace(/〕/g, s)
    .replace(/［/g, s)
    .replace(/］/g, s)

    .replace(/-+/g, s) // multiple dash to one dash
    .replace(/^-/, '') // delete dash at the beginning
    .replace(/-$/, ''); // delete dash at the end

  // replace back conflict values
  result = result.replace(/`(\d+)`/g, (match, idx) => {
    return conflictValues[parseInt(idx)];
  });

  if (result.length > 200) {
    // Stupid windows: Path Length Limitation
    return result.slice(0, 200);
  } else {
    return (result === '' ? replacement : result);
  }
}

T.toFileUrl = function(filePath) {
  return ['file', filePath].join('://');
}

T.includeFolder = function(path, folder){
  return T.sanitizePath(path).indexOf("/" + folder + "/") > -1
}

T.excludeFolder = function(path, folder){
  return !T.includeFolder(path, folder);
}

T.replacePathFilename = function(path, newFilename) {
  const p = T.sanitizePath(path);
  const idx = p.lastIndexOf('/');
  return [p.substring(0, idx), newFilename].join('/');
}

// sanitize windows path separator \
T.sanitizePath = function(path){
  return path.replace(/\\/g, '/')
}


T.expandPath = function(relativePath, currentPath) {
  const isAbsolute = currentPath.startsWith('/');
  const sep = isAbsolute ? '' : '/';
  const base = ["http://a.org", currentPath].join(sep);
  const url = new URL(relativePath, base);
  if (isAbsolute) {
    return url.pathname;
  } else {
    return url.pathname.substring(1);
  }
}

/**
 * WARNING:
 *   This function doesn't support any relative path (e.g. ../../assets).
 *   It just sanitizes '../', './' and '//', which come from configuration.
 */
T.joinPath = function(...paths){
  const arr = [];
  T.each(paths, function(path, index){
    path = T.sanitizePath(path);
    path = path.replace(/(\.\.\/)+/g, '');
    path = path.replace(/(\.\/)+/g, '');
    if (index > 0) {
      path = path.replace(/^\//, '');
    }
    path = path.replace(/\/$/, '');
    path = path.replace(/\/+/g, '/');
    arr.push(path);
  })
  return arr.join('/');
}

/** calculate path.
 * @param {string} currDir must be directory.
 * @param {string} destPath can be directory or file.
 * @return {string} relative path, if two params is the same,
 *   it return "" (empty string)
 *
 *
 * WARNING
 *   This funciton will throw a Error, if two parameters can not be calculated.
 *
 */
T.calcPath = function(currDir, destPath) {
  const pathA = T.sanitizePath(currDir);
  const pathB = T.sanitizePath(destPath);
  const strA = pathA.replace(/\/$/, '');
  const strB = pathB.replace(/\/$/, '')
  const throwError = function() {
    throw new Error(`Couldn't calculate ${pathA} and ${pathB}`);
  }
  if (strA == '' || strB == '') { throwError() }
  const partA = strA.split('/');
  const partB = strB.split('/');
  if (partA[0] !== partB[0]) {
    // we can not calculate in this situation.
    throwError();
  }
  while(true){
    let a = partA[0];
    let b = partB[0];
    if( a === undefined || b === undefined){
      break;
    }
    if(a !== b){
      break;
    }
    partA.shift();
    partB.shift();
  }
  let r = "";
  T.each(partA, (folder) => {
    r += '../'
  });
  r += partB.join('/');
  return r;
}

// ===============================
// file
// ===============================
T.readTextFile = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load",
      (event) => { resolve(reader.result) }
    );
    reader.addEventListener("error",
      (event) => {
        reject(new Error(`Error occurred reading file: ${file.name}`));
      }
    );
    reader.readAsText(file);
  });
}

// ===============================
// blob
// ===============================

T.blob2BinaryString = function(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      resolve(e.target.result);
    }
    reader.onerror = function(e) {
      const errName = (e.target.error.name || "Error")
      reject(new Error(errName));
    }
    reader.readAsBinaryString(blob);
  });
}


T.blobToBase64Str = async function(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const binStr = Array.from(bytes, (x) => String.fromCodePoint(x)).join("");
  return btoa(binStr);
}


T.base64StrToBlob = function(base64Str, mimeType) {
  const binStr = atob(base64Str);
  const bytes  = Uint8Array.from(binStr, (m) => m.codePointAt(0));
  if (mimeType) {
    return new Blob([bytes], {type: mimeType});
  } else {
    return new Blob([bytes]);
  }
}



// ====================================

T.createIdxTool = function(start) {
  return {
    idx: (start || -1),
    next: function() {
      return ++this.idx;
    }
  }
}

T.createCounter = function() {
  return {
    dict: {},
    count: function (key) {
      this.counted = true;
      this.dict[key] = (this.dict[key] || 0) + 1
    },
    get: function(key) {
      return this.dict[key];
    },
    max: function() {
      return T.maxValueKey(this.dict);
    },
  }
};


T.createMarker = function(start) {
  return {
    idx: (start || -1),
    values: [],
    template: "@[[INDEX]]",
    reReplace: /@\[\[(\d+)\]\]/mg,
    next: function() {
      return this.template.replace('INDEX', ++this.idx);
    },
    replaceBack: function(str, replacements) {
      const This = this;
      return str.replace(this.reReplace, (match, p1) => {
        const index = parseInt(p1);
        return replacements[index];
      });
    }
  }
}


/**
 * Name conflict resolver.
 *
 * if current name is used. it'll resolve nameN (name1, name2 etc.)
 *
 *
 */
T.createNameConflictResolver = function() {
  return {
    dict: {}, // {:namespace => [{:name, :resolvedName}]}
    add({namespace = 'global', name, resolvedName}) {
      if (!this.dict[namespace]) {
        this.dict[namespace] = [];
      }
      this.dict[namespace].push({name, resolvedName});
    },

    resolve({namespace = 'global', name, resolver = null}) {
      if (!this.dict[namespace]) {
        this.dict[namespace] = [];
      }


      let n = 0;
      this.dict[namespace].forEach((item) => {
        if (name === item.name) { n++ }
      });

      const tail = ( n == 0 ? '' : `${n}`);

      const resolvedName = (resolver || this.defaultResolver)(name, tail);
      this.add({namespace, name, resolvedName});
      return resolvedName;
    },

    defaultResolver(name, tail) {
      return `${name}${tail}`;
    }
  }
}



T.createFilenameConflictResolver = function() {
  return {
    dict: {}, // id => resolvedName
    nameResolver: T.createNameConflictResolver(),
    addedFolder: [],
    addFolder(folderStr) {
      const folder = T.sanitizePath(folderStr);
      if (folder.startsWith('/')) {
        throw new Error("FilenameConflictResolver can't handle absolute path: " + folder);
      }
      const parts = folder.split('/');
      let name = null;
      while (name = parts.pop()) {
        const currFolder = parts.concat(name).join('/');
        if (this.addedFolder.indexOf(currFolder) > -1) {
          // processed
          break;
        }
        const namespace = parts.join('/') || '__ROOT__';
        this.nameResolver.add({
          namespace: namespace,
          name: name,
          resolvedName: name,
        })
        this.addedFolder.push(currFolder);
      }
    },
    resolveFile(id, folderStr, filename) {
      const folder = T.sanitizePath(folderStr);
      if (this.dict[id]) {
        return this.dict[id];
      }

      const resolvedName = this.nameResolver.resolve({
        resolver: this.filenameResolver,
        namespace: folder,
        name: filename,
      });

      this.dict[id] = resolvedName;
      return resolvedName;
    },
    filenameResolver(filename, tail) {
      const [name, ext] = T.splitFilename(filename)
      return ext ? `${name}${tail}.${ext}` : `${name}${tail}`;
    },
    toObject() {
      const obj = T.sliceObj(this, ['dict', 'addedFolder']);
      obj.nameResolverDict = this.nameResolver.dict;
      return obj;
    },
    inspect() {
      return this.nameResolver.dict;
    },
    getNames(namespace) {
      return this.nameResolver.dict[namespace];
    }

  }
}

T.restoreFilenameConflictResolver = function(obj) {
  const resolver = T.createFilenameConflictResolver();
  resolver.dict = obj.dict;
  resolver.addedFolder = obj.addedFolder;
  resolver.nameResolver.dict = obj.nameResolverDict;
  return resolver;
}


// max value key
T.maxValueKey = function(numValueObj){
  let maxk = null;
  let maxv = -1;
  for(const key in numValueObj){
    const v = numValueObj[key];
    if(v > maxv){
      maxv = v;
      maxk = key;
    }
  }
  return maxk;
}

// Avoid invoking a function many times in a short period.
T.createDelayCall = function(fn, delay){
  var dc = {};
  dc.action = fn;
  dc.clearTimeout = function(){
    if(dc.timeoutId){
      clearTimeout(dc.timeoutId);
    }
  };
  dc.run = function(){
    dc.clearTimeout();
    dc.timeoutId = setTimeout(function(){
      dc.action();
      dc.clearTimeout();
    }, delay);
  };
  return dc;
};


T.createDict = function(){
  return {
    dict: {},
    add: function(k, v){ this.dict[k] = v; },
    remove: function(k){ delete this.dict[k] },
    removeByKeyPrefix: function(prefix) {
      for(let k in this.dict) {
        if (k.startsWith(prefix)) {
          this.remove(k);
        }
      }
    },
    hasKey: function(k) { return this.dict.hasOwnProperty(k) },
    find: function(k){ return this.dict[k] },
  }
}

T.createMRUCache = function(size) {
  return {
    size: size,
    array: [],
    map: new Map(),
    add(key, value) {
      if (this.size < 1) {return}
      const found = this.map.has(key);
      this.map.set(key, value);
      if ( !found ) {
        if ( this.array.length === this.size ) {
          this.map.delete(this.array.pop());
        }
        this.array.unshift(key);
      }
    },
    remove(key) {
      if ( this.map.has(key) ) {
        this.array.splice(this.array.indexOf(key), 1);
      }
    },
    get(key) {
      if (this.size < 1) {return undefined}
      const value = this.map.get(key);
      if ( value !== undefined && this.array[0] !== key ) {
        let i = this.array.indexOf(key);
        do {
          this.array[i] = this.array[i-1];
        } while ( --i );
        this.array[0] = key;
      }
      return value;
    },
    reset() {
      this.array = [];
      this.map.clear();
    }
  };
};



T.createStack = function(){
  return {
    stack: [],
    length: 0,
    isEmpty: function(){
      return this.length == 0;
    },
    push: function (obj){
      this.stack.push(obj)
      this.length++;
    },
    pop: function(){
      if(this.length > 0){
        this.length--;
        return this.stack.pop();
      }else{
        return 'empty';
      }
    },
    clear: function(){
      this.stack = [];
      this.length = 0;
    }
  }
}

// function queue
T.createFunQueue = function(){
  const state = {};
  const queue = []
  let running = false;

  function enqueue(fun) {
    queue.push((state) => {
      running = true;
      fun(state);
      running = false;
      next();
    })
    if(!running) {
      next();
    }
  }

  function next(){
    const first = queue.shift();
    if(first) { first(state) }
  }

  return {enqueue: enqueue}
}

T.createAsyncFnQueue = function() {
  const queue = []
  let running = false;

  async function enqueue(fun) {
    queue.push(async () => {
      running = true;
      await fun();
      running = false;
      await next();
    })
    if(!running) {
      await next();
    }
  }

  async function next(){
    const first = queue.shift();
    if(first) {
      await first()
    }
  }

  return {enqueue: enqueue}
}


T.createArrayCache = function(reverselySeek = 'noReverselySeek') {
  return {
    findIdxFnName: (reverselySeek === 'reverselySeek' ? 'lastIndexOf' : 'indexOf'),
    keys: [],
    values: [],
    invalidIndexes: [],
    findOrCache: function(key, action) {
      const idx = this.keys[this.findIdxFnName](key);
      if (this.invalidIndexes.indexOf(idx) > -1 || idx == -1) {
        const value = action();
        this.keys.push(key);
        this.values.push(value);
        return value;
      } else {
        return this.values[idx];
      }
    },
    setInvalid: function(key) {
      const idx = this.keys[this.findIdxFnName](key);
      if (idx > -1) {
        this.invalidIndexes.push(key);
      }
    },
    clear: function() {
      this.keys = [];
      this.values = [];
    }
  }
}

/*
 * @param {Function} action - this function should return a promise that
 *                          resolve with result
 *                          or reject with a object {:message, :retry}
 * @param {Integer} n - How many times we'll try.
 *
 * @return {Promise} doing
 */
T.retryAction = function(action, n = 3, errObjs = []) {
  if (n == 0) {
    const errMsg = errObjs.map((it, idx) => `[${idx + 1}] ${it.message}`).join("\n");
    return Promise.reject(new Error(errMsg));
  } else {
    return new Promise((resolve, reject) => {
      action().then(
        (result) => {
          resolve(result);
        }, (errObj) => {
          errObjs.push(errObj);
          if (errObj.retry) {
            T.retryAction(action, n-1, errObjs).then(resolve, reject);
          } else {
            const errMsg = errObjs.map((it, idx) => `[${idx + 1}] ${it.message}`).join("\n");
            reject(new Error(errMsg));
          }
        }
      );
    });
  }
}


T.stackReduce = async function(firstItem, itemFn, initValue) {
  let stack = [firstItem], accValue = initValue;

  while (stack.length > 0) {
    const [currItem, ...restItems] = stack;
    const itemResult = await itemFn(currItem, accValue);
    const it = (itemResult || {});

    if (it.hasOwnProperty('newValue')) {
      accValue = it.newValue;
    }

    if (it.newItems && it.newItems.length > 0) {
      stack = it.newItems.concat(restItems);
    } else {
      stack = restItems;
    }
  }

  return accValue;
}


// ====================================
// HTTP relative
// ====================================

T.mimeType2Extension = function(mimeType) {
  if (!mimeType) return '';
  const extension = mime.getExtension(mimeType);
  return extension || '';
}

T.extension2MimeType = function(extension) {
  if (!extension) return '';
  const mimeType = mime.getType(extension)
  return mimeType || '';
}


T.createResourceCache = function({size = 80}) {

  function addCacheDataReaders(cache) {
    const readers = {
      readAsText: function() {
        let charset = 'utf-8';
        const header = T.getHeader(this.responseHeaders, 'content-type');
        if (header) {
          const r = T.parseContentType(header.value);
          if (r && r.parameters.charset) {
            charset = r.parameters.charset;
          }
        }
        const decoder = new TextDecoder(charset);
        return decoder.decode(this.data);
      },
      readAsBlob: function() {
        const header = T.getHeader(this.responseHeaders, 'content-type');
        let mimeType;
        if (header) {
          const r = T.parseContentType(header.value);
          mimeType = r.mimeType;
        } else {
          mimeType = T.resourceType2MimeType(this.resourceType);
        }
        return new Blob([this.data], {type: mimeType});
      },
      readAsResponse: function(opts = {}) {
        const {headersOnly = false} = opts;
        const blackList = ['set-cookie', 'set-cookie2'];
        const headers = new Headers();
        this.responseHeaders.forEach(({name, value}) => {
          if (blackList.indexOf(name.toLowerCase()) == -1) {
            headers.append(name, value);
          }
        });
        const init = {status: 200, statusText: "OK", headers: headers};
        const body = (headersOnly ? "" : this.data);
        return new Response(body, init);
      },
    };
    return Object.assign({}, cache, readers);
  }

  return {
    cache: T.createMRUCache(size),

    /*
     * @param {String} url - request url
     * @param {Object} details
     *      - {String} resourceType
     *      - {Uint8Array} data
     *      - {Array} responseHeaders
     *          - {Object} Header {:name, :value}
     */
    add(url, details) {
      if (details.data && details.data.length > 0) {
        this.cache.add(url, details)
      }
    },
    get(url) {
      const it = this.cache.get(url);
      if (it && it.data && it.data.length > 0) {
        return addCacheDataReaders(it);
      } else {
        // empty cache or bad cache
        return null;
      }
    },
    peek() {
      const result = [];
      // link, headers, byteSize
      this.cache.array.forEach((key) => {
        const value = this.cache.map.get(key);
        result.push({
          link: key,
          headers: value.responseHeaders,
          byteSize: value.data.length,
        });
      });
      return result;
    },
    reset() {
      this.cache.reset();
    }
  }
}


/**
 * Get header
 *
 * @param {Array} headers
 *      - {Object} header {:name, :value}
 * @param {String} name(should be lowercase)
 * @return {Object} header
 *
 */
T.getHeader = function(headers, name) {
  return [].find.call(headers, function(header){
    // some server's header name is lower case ... (fixit)
    return header.name.toLowerCase() === name;
  })
}

/**
 * @param {String} headerText:
 *   "date: Thu, 07 Jan 2021 07:21:53 GMT
 *   content-length: 70441
 *   content-type: image/png"
 * @return {Object} Headers object
 *
 */
T.headerText2HeadersObj = function(headerText) {
  const headers = new Headers();
  headerText.split(/\n+/).forEach((line) => {
    if (line.match(/^\S*$/)) {
      // empty line
    } else {
      try {
        const idx = line.indexOf(':');
        const name = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        headers.append(name, value);
      } catch (e) {
        // invalid header name.
      }
    }
  });
  return headers;
}

/**
 * Parse Content-Type
 *
 * type/subtype[;parameterName=parameterValue]*
 * example:
 *   - text/html
 *   - text/html;charset=utf-8
 *   - text/html;charset=UTF-8
 *   - Text/HTML;Charset="utf-8"
 *   - text/html; charset="utf-8"
 *
 * The type, subtype, and parameter name tokens are case-insensitive.
 * Parameter values might or might not be case-sensitive, depending on
 * the semantics of the parameter name [RFC7231 p8-p9].
 *
 * @param {String} value
 * @return {Object}
 *   - {String} mimeType
 *   - {Object} parameters(name -> value)
 */
T.parseContentType = function(value) {
  const [mimeType, ...rests] = value.split(';').map(it => it.trim());
  const parameters = {};
  const caseInsensitiveParameters = ['charset'];
  rests.forEach((it) => {
    const [k, v] = it.split('=');
    if (k && v) {
      const name = k.toLowerCase();
      let value = v.replace(/"/g, '');
      if (caseInsensitiveParameters.indexOf(name) > -1) {
        value = value.toLowerCase();
      }
      parameters[name] = value;
    }
  });
  return {mimeType: mimeType.toLowerCase(), parameters}
}


/*
 *
 * Content-Disposition: inline
 * Content-Disposition: attachment
 * Content-Disposition: attachment; filename="filename.jpg"
 *
 */
T.parseContentDisposition = function(headerValue) {
  const [value, ...rests] = headerValue.split(';').map(it => it.trim());
  const parameters = {};
  rests.forEach((it) => {
    const [k, v] = it.split('=');
    if (k && v) {
      const name = k.toLowerCase();
      let value = v.replace(/"/g, '');
      parameters[name] = value;
    }
  });
  return {value, parameters}
}

T.contentDisposition2MimeType = function(headerValue) {
  const {value, parameters} = T.parseContentDisposition(headerValue);
  if ("attachment" === value && parameters.filename) {
    const [_, extension] = T.splitFilename(parameters.filename);
    if (extension) {
      const mimeType = T.extension2MimeType(extension);
      return mimeType === '' ? null : mimeType;
    } else {
      return null;
    }
  } else {
    return null;
  }
}


T.resourceType2MimeType = function(type) {
  switch(type) {
    case 'style': return 'text/css';
    case 'image':
    case 'font':
      return 'application/octet-binary';
  }
}


// ====================================

T.escapeHtmlAttr = function(string) {
  return String(string).replace(/[&<>"'`]/g, function(s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#x60;',
    })[s];
  });
}


T.escapeHtml = function(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    })[s];
  });

}


T.escapeCodeNodeText = function(str) {
  return String(str).replace(/[&<>]/mg, function (s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
    })[s];
  });
}


T.escapeRegExp = function(str) {
  const re = /[.*+?^${}()|[\]\\]/g
  return str.replace(re, "\\$&");
}


T.getTagsByName = function(elem, name){
  let r = []
  if(elem.tagName.toUpperCase() === name.toUpperCase()){
    r.push(elem);
  }
  const child = elem.getElementsByTagName(name)
  return r.concat(T.iterable2Array(child));
}

// Gteq => greater than or equals to
T.isVersionGteq = function(vA, vB) {
  const [majorA, minorA = 0, microA = 0, secureA = 0] = T.extractVersion(vA);
  const [majorB, minorB = 0, microB = 0, secureB = 0] = T.extractVersion(vB);
  if (majorA != majorB) { return majorA > majorB }
  if (minorA != minorB) { return minorA > minorB }
  if (microA != microB) { return microA > microB }
  return secureA >= secureB;
}

// Lteq => less than or equals to
T.isVersionLteq = function(vA, vB) {
  const [majorA, minorA = 0, microA = 0, secureA = 0] = T.extractVersion(vA);
  const [majorB, minorB = 0, microB = 0, secureB = 0] = T.extractVersion(vB);
  if (majorA != majorB) { return majorA < majorB }
  if (minorA != minorB) { return minorA < minorB }
  if (microA != microB) { return microA < microB }
  return secureA <= secureB;
}

T.extractVersion = function(version) {
  return version.split('.').map((it) => parseInt(it));
}

//rgbStr: rgb(255, 255, 255)
T.extractRgbStr = function(rgbStr) {
  return rgbStr.match(/\d{1,3}/g).map((it) => parseInt(it));
}

/*
 * replace ${key} use v.$key
 */
T.renderTemplate = function(template, v) {
  const regExp = /\$\{([^\$\}]+)\}/mg;
  return template.replace(regExp, function(match, key) {
    return (v[key] || '')
  });
}

export default T;
