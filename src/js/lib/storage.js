"use strict";

import T from './tool.js';
import ExtApi from './ext-api.js';

const KEY_OF_KEYS = '__KEYS__';

async function set(storageArea, key, value) {
  const change = {[key]: value}
  const result = getStorage(storageArea).set(change)
  await saveKeys(storageArea, [key]);
  return result;
}


async function get(storageArea, key, defaultValue) {
  const data = await getStorage(storageArea).get(key);
  const value = data[key];
  if (defaultValue !== null && (typeof defaultValue !== 'undefined')) {
    if (typeof value !== 'undefined'){
      return value;
    } else {
      await set(storageArea, key, defaultValue);
      return defaultValue;
    }
  } else {
    return value;
  }
}


async function setMultiItem(storageArea, dict) {
  const result = await getStorage(storageArea).set(dict);
  await saveKeys(storageArea, Object.keys(dict));
  return result;
}

// @param {String/Array} keys
async function remove(storageArea, keys) {
  const keysToRemove = T.toArray(keys)
  const result = await getStorage(storageArea).remove(keysToRemove);
  await removeKeys(storageArea, keysToRemove)
  return result;
}

async function clear(storageArea) {
  const result = getStorage(storageArea).clear();
  await saveKeysToStorage(storageArea, []);
  return result;
}

function getTotalBytes(storageArea) {
  return getBytesInUse(storageArea);
}

// @param {String/Array} keys
// @return {Promise} resolve with n
//                   or reject with an error message
function getBytesInUse(storageArea, keys) {
  if (getStorage(storageArea).getBytesInUse) {
    return getStorage(storageArea).getBytesInUse(keys);
  } else {
    // getBytesInUse() is not supported
    return Promise.reject("getBytesInUser() is not supported");
  }
}


async function removeByFilter(storageArea, ...filters) {
  if (filters.length === 0) {
    throw new Error("Not filter are provided.");
  }
  const allKeys = await getKeys(storageArea);
  const keys = T.sliceArrByFilter(allKeys, ...filters);
  return await remove(storageArea, keys);
}

/*
 * query all storaged data. according to filters
 *
 * @param {Function} filter
 *                   @see T.sliceArrByFilter for details
 *
 * @return {Object} the queried object
 *
 */
async function query(storageArea, ...filters) {
  if (filters.length === 0) {
    throw new Error("Not filter are provided.");
  }

  const allKeys = await getKeys(storageArea);
  const keys = T.sliceArrByFilter(allKeys, ...filters);
  return await getStorage(storageArea).get(keys);
}

// TODO new API available: StorageArea.getKeys()
async function getKeys(storageArea) {
  const data = await getStorage(storageArea).get(KEY_OF_KEYS);
  if (data.hasOwnProperty(KEY_OF_KEYS)) {
    return data[KEY_OF_KEYS];
  } else {
    return await refreshKeys(storageArea);
  }
}



async function saveKeys(storageArea, newKeys) {
  const keys = await getKeys(storageArea);
  const keysToSave = [];
  for (const newKey of newKeys) {
    if (!keys.includes(newKey)) {
      keysToSave.push(newKey);
    }
  }
  if (keysToSave.length > 0) {
    await saveKeysToStorage(storageArea, [...keys, ...keysToSave])
  }
}

async function removeKeys(storageArea, keysToRemove) {
  const keys = await getKeys(storageArea);
  const restKeys = [];
  for (const key of keys) {
    if (!keysToRemove.includes(key)) {
      restKeys.push(key);
    }
  }
  if (restKeys.length !== keys.length) {
    await saveKeysToStorage(storageArea, restKeys);
  }
}


// This is a very heavy function, should avoid as much as possible
async function refreshKeys(storageArea) {
  const data = await getStorage(storageArea).get(null);
  const keys = [];
  for (const key in data) {
    if (key !== KEY_OF_KEYS) {
      keys.push(key);
    }
  }

  await saveKeysToStorage(storageArea, keys);
  return keys;
}


async function saveKeysToStorage(storageArea, keys) {
  const change = {[KEY_OF_KEYS]: keys};
  return await getStorage(storageArea).set(change);
}


function getStorage(storageArea) {
  const storage = ExtApi.getStorageArea(storageArea);
  if (storage) {
    return storage;
  } else {
    throw new Error(`StorageArea not available: ${storageArea}`);
  }
}

async function getFromContentSession(key, defaultValue) {
  const storageArea = getContentSessionStorageArea();
  return get(storageArea, key, defaultValue);
}


async function setToContentSession(key, value) {
  const storageArea = getContentSessionStorageArea();
  return set(storageArea, key, value);
}

async function removeFromContentSession(key) {
  const storageArea = getContentSessionStorageArea();
  return remove(storageArea, key);
}


function getContentSessionStorageArea() {
  const session = ExtApi.getStorageArea('session');
  if (session) {
    if (ExtApi.isBackground()) {
      if ((typeof session.setAccessLevel) == 'function') {
        // session storage area is fully supported in content scripts
        return 'session';
      } else {
        // session storage only available in background
        return 'local';
      }
    } else {
      // content script can access session (fully supported)
      return 'session';
    }
  } else {
    // Not session storage support
    return 'local';
  }
}


// Only available in background script
function initContentSession() {
  const session = ExtApi.getStorageArea('session');
  if (session && (typeof session.setAccessLevel) == 'function') {
    session.setAccessLevel({accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS'});
  }
}

function applyFirstArgument(fn, firstArgument) {
  return (...args) => {
    const newArgs = [firstArgument, ...args];
    return fn(...newArgs);
  }
}


function createStorageAreaApi(storageArea) {
  return {
    getKeys       : applyFirstArgument(getKeys, storageArea),
    set           : applyFirstArgument(set, storageArea),
    get           : applyFirstArgument(get, storageArea),
    setMultiItem  : applyFirstArgument(setMultiItem, storageArea),
    remove        : applyFirstArgument(remove, storageArea),
    removeByFilter: applyFirstArgument(removeByFilter, storageArea),
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
const Storage = Object.assign(
  {
    initContentSession,
    setToContentSession,
    getFromContentSession,
    removeFromContentSession,
  },
  local,
  {session, local}
);
export default Storage;

