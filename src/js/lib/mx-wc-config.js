
"use strict";

this.MxWcConfig = (function() {
  const state = {};

  function getDefault(){
    return {
      allowFileSchemeAccess: false,
      saveFormat: 'html',
      saveClippingInformation: true,
      saveDomainAsTag: false,
      saveTitleAsFilename: false
    }
  }

  /*
   * Fix config's keys if we add new item.
   */
  function fixKeys(config){
    const defaultConfig = getDefault();
    for(const k in defaultConfig){
      if(!config.hasOwnProperty(k)){
        config[k] = defaultConfig[k];
      }
    }
    return config;
  }

  /*
   * @returns a promise
   */
  function load() {
    return new Promise(function(resolv, _) {
      MxWcStorage.get('config', getDefault())
        .then((config) => {
          state.config = fixKeys(config);
          resolv(state.config);
        });
    });
  }

  function update(k, v) {
    if (state.config) {
      state.config[k] = v;
      MxWcStorage.set('config', state.config);
    } else {
      console.error("MxWcConfig: must load config first");
    }
  }

  function reset() {
    return new Promise(function(resolv, _) {
      const deafultConfig = getDefault();
      state.config = defaultConfig;
      MxWcStorage.set('config', state.config);
      resolv(state.config);
    });
  }

  return {
    load: load,
    update: update,
    reset: reset,
  }

})();
