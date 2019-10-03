;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcStorage = factory();
  }
})(this, function(undefined) {
  "use strict";

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

  return {
    type: 'local',
    get: get,
    set: set,
    remove: remove,
    clear: clear,
  };
});
