"use strict";

import T              from '../lib/tool.js';
import Log            from '../lib/log.js';
import ExtMsg         from '../lib/ext-msg.js';
import MxWcStorage    from '../lib/storage.js';
import SelectionStore from './store.js';

function messageHandler(message, sender) {
  return new Promise(function(resolve, reject) {
    switch (message.type) {
      case 'query':
        query(message.body).then(resolve);
        break;
      case 'save':
        save(message.body).then(resolve);
        break;
      case 'reset':
        reset().then(resolve);
        break;
      case 'restart':
        restart();
        resolve();
        break;
      default:
        reject(new Error(`selection/backend.js: Unknown message: ${message.type}`));
        break;
    }
  });
}

// host => store
const StoreDict = {};

async function save({host, path, selection}) {
  const Store = await getStore(host);
  Store.set(path, selection);
  await saveStore(host, Store);
}

async function query({host, path}) {
  const Store = await getStore(host);
  return Store.get(path)
}

// all data storage in MxWcStorage will be removed
async function reset() {
  const filter = T.prefixFilter('selectionStore', true);
  await MxWcStorage.removeByFilter(filter)
  restart();
}

// just clear StoreDict
// force it to refetch from Storage
function restart() {
  for (let key in StoreDict) {
    delete StoreDict[key];
  }
}

async function getStore(host) {
  let Store = StoreDict[host];
  if (!Store) {
    const treeHash = await MxWcStorage.get(getKey(host));
    Store = SelectionStore.create(treeHash);
    StoreDict[host] = Store;
  }
  return Store;
}

async function saveStore(host, Store) {
  const treeHash = Store.toHash();
  await MxWcStorage.set(getKey(host), treeHash);
}

function getKey(host) {
  return ['selectionStore', host].join('.');
}

export default function init() {
  ExtMsg.listen('backend.selection', messageHandler);
  Log.debug("MX backend: Selection initialized");
}
