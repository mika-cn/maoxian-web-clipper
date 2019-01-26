
/* tool */
var T = {};
T.findElem = function(id){ return document.getElementById(id) };

T.queryElem = function(selector){ return document.querySelector(selector) };


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


T.rjustNum = function(num, length){
  let s = num.toString();
  if(s.length >= length){ return s }
  return T.rjustNum('0' + s, length)
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
  return tObj;
}


// obj: element or selector
T.setHtml = function(obj, html) {
  const elem = (typeof obj === 'object' ? obj: T.queryElem(obj));
  if(elem){ elem.innerHTML = html }
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
  partA.forEach((fold) => {
    r += '../'
  });
  r += partB.join('/');
  return r;
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
