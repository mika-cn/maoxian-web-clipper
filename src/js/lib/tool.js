;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(require('blueimp-md5'));
  } else {
    // browser or other
    root.MxWcTool = factory(root.md5);
  }
})(this, function(md5, undefined) {
  "use strict";
  // Tool
  const T = {};

  T.toJsVariableName = function(str) {
    const it = T.capitalize(str);
    const [char1, rest] = [
      it.substr(0, 1),
      it.substr(1)
    ];
    return char1.toLowerCase() + rest;
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
    return [
      str.substring(0, idx),
      str.substring(idx + sep.length)
    ];
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


  T.isElemVisible = function(win, elem) {
    if(['STYLE', 'IMG', 'PICTURE'].indexOf(elem.tagName.toUpperCase()) > -1) {
      return true
    }

    const style = win.getComputedStyle(elem);
    if(style.display === 'none') {
      return false;
    }

    if(style.visibility === 'hidden'){
      return false
    }

    /*
    const box = elem.getBoundingClientRect();
    if(box.width === 0 && box.height === 0){
      return false
    }
    */
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
      const detailJson = JSON.stringify({selector: selector});
      const e = new CustomEvent('___.mx-wc.page.changed', {detail: detailJson});
      document.dispatchEvent(e);
    }
  }



  T.bind = function(elem, evt, fn, useCapture){
    elem.addEventListener(evt, fn, useCapture);
  }

  T.unbind = function(elem, evt, fn, useCapture){
    elem.removeEventListener(evt, fn, useCapture);
  }

  T.bindOnce = function(elem, evt, fn, useCapture){
    T.unbind(elem, evt, fn, useCapture);
    T.bind(elem, evt, fn, useCapture);
  }

  // split tag string by space or comma.
  T.splitTagstr = function(str){
    str = str.replace(/^[ ,，]+/, '');
    str = str.replace(/[ ,，]+$/, '');
    if(str.length === 0){
      return [];
    }else{
      str = str.trim().replace(/[ ,，]+/g, ',');
      const items = T.map(
        str.split(","),
        function(it){ return it.trim()}
      );
      return T.unique(items);
    }
  }

  // collection

  T.unique = function(collection){
    const arr = T.toArray(collection);
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
  T.toArray = function(collection){
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


  T.toJson = function(hash) { return JSON.stringify(hash);}

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

  T.isExtensionUrl = function(url){
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


  T.getUrlFileName = function(url){
    return new URL(decodeURI(url)).pathname.split('/').pop();
  }


  T.getFileExtension = function(filename){
    if(filename.indexOf('.') > -1){
      return filename.split('.').pop();
    }else{
      return '';
    }
  }

  // return [name, extension]
  T.splitFilename = function(filename) {
    const idx = filename.lastIndexOf('.');
    if (idx > -1) {
      return [
        filename.substring(0, idx),
        filename.substring(idx + 1)
      ]
    } else {
      return [filename, null];
    }
  }

  // not support data protocol URLs
  T.getUrlExtension = function(url){
    return T.getFileExtension(T.getUrlFileName(url));
  }

  // require md5 library
  T.calcAssetName = function(url, ext){
    const extension = (ext || T.getUrlExtension(url));
    if(extension){
      return [md5(url), extension].join('.');
    }else{
      return md5(url);
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

  T.wrapDate = function(date) {
    const tObj = {
      value  : date,
      year   : date.getFullYear(),
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
    tObj.str = {
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

    tObj.toString = function(){
      // YYYY-MM-dd HH:mm:ss
      const s = tObj.str;
      return `${s.year}-${s.month}-${s.day} ${s.hour}:${s.minute}:${s.second}`;
    }

    tObj.time = function() {
      const s = tObj.str;
      return `${s.hour}:${s.minute}:${s.second}`;
    }

    tObj.beginingOfDay = function(){
      const s = tObj.str;
      return `${s.year}-${s.month}-${s.day} 00:00:00`;
    }

    tObj.endOfDay = function(){
      const s = tObj.str;
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
    T.each(paths, function(path){
      path = T.sanitizePath(path);
      path = path.replace(/(\.\.\/)+/g, '');
      path = path.replace(/(\.\/)+/g, '');
      path = path.replace(/^\//, '');
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
    const strA = currDir.replace(/\/$/, '');
    const strB = destPath.replace(/\/$/, '')
    const throwError = function() {
      throw new Error(`Couldn't calculate ${currDir} and ${destPath}`);
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

  // ====================================


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


  T.getTagsByName = function(elem, name){
    let r = []
    if(elem.tagName.toUpperCase() === name.toUpperCase()){
      r.push(elem);
    }
    const child = elem.getElementsByTagName(name)
    return r.concat(T.toArray(child));
  }

  T.isVersionGteq = function(versionA, versionB) {
    const [majorA, minorA, patchA] = T.extractVersion(versionA);
    const [majorB, minorB, patchB] = T.extractVersion(versionB);
    if (majorA != majorB) { return majorA > majorB }
    if (minorA != minorB) { return minorA > minorB }
    return patchA >= patchB;
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

  return T;
});
