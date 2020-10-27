"use strict";

//const browser = require('webextension-polyfill');
import T from './tool.js';

const TYPE = 'local';

function set(k, v) {
  const d = {}
  d[k] = v
  return browser.storage[TYPE].set(d)
}

function setMultiItem(dict) {
  return browser.storage[TYPE].set(dict);
}

// @param {String/Array} keys
function remove(keys) {
  return browser.storage[TYPE].remove(keys);
}

function clear() {
  return browser.storage[TYPE].clear();
}

function getTotalBytes() {
  return getBytesInUse();
}

// @param {String/Array} keys
// @return {Promise} resolve with n
//                   or reject with an error message
function getBytesInUse(keys) {
  if (browser.storage[TYPE].getBytesInUse) {
    return browser.storage[TYPE].getBytesInUse(keys);
  } else {
    // getBytesInUse() is not supported
    return Promise.reject("getBytesInUser() is not supported");
  }
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

function getAll() {
  return browser.storage[TYPE].get(null);
}

/*
 * query all storaged data. according to filters
 *
 * @param {Function} filter
 *                   @see T.sliceObjByFilter for details
 *
 * @return {Promise} quering
 *                   A promise that resolve with a object.
 *
 */
function query(...filters) {
  if (filters.length === 0) {
    return Promise.reject("Not filter are provided.");
  }
  return new Promise((resolve, reject) => {
    getAll().then((data) => {
      resolve(T.sliceObjByFilter(data, ...filters));
    })
  })
}

const Storage = {
  set, setMultiItem,
  get, getAll,
  getBytesInUse,
  getTotalBytes,
  remove,
  clear,
  query,
};

export default Storage;

