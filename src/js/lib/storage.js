"use strict";

//const browser = require('webextension-polyfill');

const TYPE = 'local';

function set(k, v){
  const d = {}
  d[k] = v
  return browser.storage[TYPE].set(d)
}

// keys: string or Array
function remove(keys) {
  return browser.storage[TYPE].remove(keys);
}

function clear() {
  return browser.storage[TYPE].clear();
}

function get(k, defaultValue){
  return new Promise((resolve, reject) => {
    browser.storage[TYPE].get(k)
      .then((res) => {
        const v = res[k];
        if(defaultValue !== null && (typeof defaultValue !== 'undefined')){
          if(typeof v != 'undefined'){
            resolve(v)
          }else{
            set(k, defaultValue);
            resolve(defaultValue);
          }
        }else{
          resolve(v);
        }
      })
  });
}

const Storage = {
  get: get,
  set: set,
  remove: remove,
  clear: clear,
};

export default Storage;
