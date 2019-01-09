
// Tool
const T = {};

T.createId = function() {
  return '' + Math.round(Math.random() * 100000000000);
}

T.findElem = function(id){ return document.getElementById(id) }
T.firstElem = function(className){ return T.queryElem(`.${className}`) }
T.queryElem = function(selector){ return document.querySelector(selector) }
T.queryElems = function(selector){ return document.querySelectorAll(selector) }

// obj: element or selector
T.setHtml = function(obj, html) {
  const elem = (typeof obj === 'object' ? obj: T.queryElem(obj));
  if(elem){ elem.innerHTML = html }
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

T.toJson = function(hash) { return JSON.stringify(hash);}

T.isFileUrl = function(url){
  return url.startsWith('file:');
}

T.isExtensionUrl = function(url){
  if(url.indexOf('://') > -1) {
    const protocol = url.split('://')[0];
    return !!protocol.match(/-extension$/);
  } else {
    return false
  }
}

// Browser built-in pages
T.isBrowserUrl = function(url){
  return ([
    'about:',     /* Firefox */
    'chrome://',  /* Chrome or Chromium */
    'vivaldi://', /* vivaldi */
  ]).some(function(it){
    return url.startsWith(it);
  });
}


T.prefixUrl = function(part, base){
  return (new URL(part, base)).href;
}

T.isUrlSameLevel = function(a, b){
  return a.slice(0, a.lastIndexOf('/')) === b.slice(0, b.lastIndexOf('/'));
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
    month  : date.getMonth() + 1,
    day    : date.getDate(),
    hour   : date.getHours(),
    minute : date.getMinutes(),
    second : date.getSeconds(),
    intSec : Math.floor(date/1000),
    intMs  : date / 1
  }
  tObj.str = {
    year: tObj.year.toString(),
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
  const winReservedNames = [ 'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  ];
  if(winReservedNames.indexOf(name) > -1){
    return "InvalidName" + name;
  } else {
    if(name.length > 200){
      // Stupid windows: Path Length Limitation
      name = name.slice(0, 200);
    }
    /* "/", "?", <space>, "|", "<", ">", "\", ":", ","
     * "*", '"'
     * "#"
     * "."
     * "。" chinese period
     * "~"
     * "!"
     * "！" chinese exclamation mark
     * "，" chinese comma
     * "？" chinese question mark
     * "-" multiple dash to one dash
     * "-" delete dash at the end
     */
    return name
      .replace(/[\/\?\s\|<>\\:,\.]/g, '-')
      .replace(/[\*"]/g, '-')
      .replace(/#/g, '-')
      .replace(/\.$/, '-')
      .replace(/。/g, '-')
      .replace(/~/g, '-')
      .replace(/!/g, '-')
      .replace(/！/g, '-')
      .replace(/，/g, '-')
      .replace(/？/g, '-')
      .replace(/-+/g, '-')
      .replace(/-$/, '');
  }
}

T.includeFold = function(path, fold){
  return T.sanitizePath(path).indexOf("/" + fold + "/") > -1
}

T.excludeFold = function(path, fold){
  return !T.includeFold(path, fold);
}

// sanitize windows path separator \
T.sanitizePath = function(path){
  return path.replace(/\\/g, '/')
}

T.joinPath = function(paths){
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

T.calcPath = function(currDir, destDir) {
  const partA = currDir.split('/');
  const partB = destDir.split('/');
  while(true){
    let foldA = partA[0];
    let foldB = partB[0];
    if(foldA === null || foldB === null){
      break;
    }
    if(foldA !== foldB){
      break;
    }
    partA.shift();
    partB.shift();
  }
  let r = "";
  T.each(partA, (fold) => {
    r += '../'
  });
  r += partB.join('/');
  return r;
}

T.createDict = function(){
  return {
    dict: {},
    add: function(k, v){ this.dict[k] = v; },
    remove: function(k){ delete this.dict[k] },
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

T.isDataProtocol = function(link){
  return (link.match(/^data:/i) ? true : false)
}

T.isHttpProtocol = function(link){
  if(!link){ return false }
  if(link.match(/^[^\/:]+:\/\//)){
    if(link.match(/^http/i)){
      return true
    }else{
      /*
       * file://
       * chrome-extension://
       * moz-extension://
       */
      return false
    }
  }else{
    if(  link.match(/^javascript:/i)
      || link.match(/^void\(0\)/i)
      || link.match(/^data:/i)
      || link.match(/^about:/i)
    ){ return false }
    return true
  }
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

T.completeElemLink = function(elem, fullUrl){
  const anchorTags = T.getTagsByName(elem, 'a');
  const imageTags  = T.getTagsByName(elem, 'img');
  const iframeTags = T.getTagsByName(elem, 'iframe');
  const groups = [
    [anchorTags , 'href'],
    [imageTags  , 'src'],
    [iframeTags , 'src']
  ];
  T.each(groups, function(it){
    const [tags, attr] = it;
    T.each(tags, function(tag){
      if(attr === 'src' && tag.hasAttribute('srcset')){
        // FIXME
        tag.removeAttribute('srcset');
      }
      if(T.isHttpProtocol(tag[attr])){
        tag.setAttribute(attr, T.prefixUrl(tag[attr], fullUrl));
      }
    });
  })
  return elem;
}


T.getTagsByName = function(elem, name){
  let r = []
  if(elem.tagName === name.toUpperCase()){
    r.push(elem);
  }
  const child = elem.getElementsByTagName(name)
  return r.concat(T.toArray(child));
}

T.isVersionGteq = function(versionA, versionB) {
  const [majorA, minorA, patchA] = T.extractVersion(versionA);
  const [majorB, minorB, patchB] = T.extractVersion(versionB);
  return majorA >= majorB && minorA >= minorB && patchA >= patchB;
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
