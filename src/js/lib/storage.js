  "use strict";

  //const browser = require('webextension-polyfill');

  function set(k, v){
    const d = {}
    d[k] = v
    return browser.storage[this.type].set(d)
  }

  // keys: string or Array
  function remove(keys) {
    return browser.storage[this.type].remove(keys);
  }

  function clear() {
    return browser.storage[this.type].clear();
  }

  function get(k, defaultValue){
    return new Promise((resolve, reject) => {
      browser.storage[this.type].get(k)
        .then((res) => {
          const v = res[k];
          if(defaultValue !== null && (typeof defaultValue !== 'undefined')){
            if(typeof v != 'undefined'){
              resolve(v)
            }else{
              MxWcStorage.set(k, defaultValue);
              resolve(defaultValue);
            }
          }else{
            resolve(v);
          }
        })
    });
  }

  const Storage = {
    type: 'local',
    get: get,
    set: set,
    remove: remove,
    clear: clear,
  };

  export default Storage;
