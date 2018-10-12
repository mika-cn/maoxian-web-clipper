"use strict"

this.MxWcStorage = (function(){

  function set(k, v){
    const d = {}
    d[k] = v
    return browser.storage[this.type].set(d)
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

  return { type: 'local', set: set, get: get }
})();
