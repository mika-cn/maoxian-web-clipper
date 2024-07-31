"use strict";

import T from './tool.js';


function set(storageArea, key, value) {
  const change = {}
  change[key] = value
  return browser.storage[storageArea].set(change)
}


function get(storageArea, key, defaultValue) {
  return new Promise((resolve, reject) => {
    browser.storage[storageArea].get(key)
      .then((res) => {
        const value = res[key];
        if (defaultValue !== null && (typeof defaultValue !== 'undefined')) {
          if (typeof value !== 'undefined'){
            resolve(value)
          } else {
            set(storageArea, key, defaultValue);
            resolve(defaultValue);
          }
        } else {
          resolve(value);
        }
      })
  });
}


function setMultiItem(storageArea, dict) {
  return browser.storage[storageArea].set(dict);
}

// @param {String/Array} keys
function remove(storageArea, keys) {
  return browser.storage[storageArea].remove(keys);
}

function clear(storageArea) {
  return browser.storage[storageArea].clear();
}

function getTotalBytes(storageArea) {
  return getBytesInUse(storageArea);
}

// @param {String/Array} keys
// @return {Promise} resolve with n
//                   or reject with an error message
function getBytesInUse(storageArea, keys) {
  if (browser.storage[storageArea].getBytesInUse) {
    return browser.storage[storageArea].getBytesInUse(keys);
  } else {
    // getBytesInUse() is not supported
    return Promise.reject("getBytesInUser() is not supported");
  }
}

function getAll(storageArea) {
  return browser.storage[storageArea].get(null);
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
function query(storageArea, ...filters) {
  if (filters.length === 0) {
    return Promise.reject("Not filter are provided.");
  }
  return new Promise((resolve, reject) => {
    getAll(storageArea).then((data) => {
      resolve(T.sliceObjByFilter(data, ...filters));
    })
  })
}


function applyFirstArgument(fn, firstArgument) {
  return (...args) => {
    const newArgs = [firstArgument, ...args];
    return fn(...newArgs);
  }
}


function createStorageAreaApi(storageArea) {
  return {
    set           : applyFirstArgument(set, storageArea),
    get           : applyFirstArgument(get, storageArea),
    setMultiItem  : applyFirstArgument(setMultiItem, storageArea),
    getAll        : applyFirstArgument(getAll, storageArea),
    remove        : applyFirstArgument(remove, storageArea),
    clear         : applyFirstArgument(clear, storageArea),
    query         : applyFirstArgument(query, storageArea),
    getBytesInUse : applyFirstArgument(getBytesInUse, storageArea),
    getTotalBytes : applyFirstArgument(getTotalBytes, storageArea),
  };
}


// Storage Area
const local   = createStorageAreaApi('local');
const session = createStorageAreaApi('session');
// set "local" as default storageArea
const Storage = Object.assign({}, local, {session, local});
export default Storage;

