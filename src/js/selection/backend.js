
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/storage.js'),
      require('./store.js')
    );
  } else {
    // browser or other
    root.MxWcSelectionBackend = factory(
      root.MxWcStorage,
      root.MxWcSelectionStore
    );
  }
})(this, function(MxWcStorage, SelectionStore, undefined) {
  "use strict";

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

  return {
    save: save,
    query: query
  }
});
