
"use strict";

this.MxWcConfig = (function() {
  const state = {};

  function getDefault(){
    return {
      saveFormat: 'html',
      saveWebFont: false,
      saveClippingInformation: true,
      saveDomainAsTag: false,

      /* $MX-WC/ */
      assetPath: '$CLIP-FOLD/assets',
      saveTitleAsFoldName: false,
      saveTitleAsFilename: false,
      defaultCategory: 'default',

      allowFileSchemeAccess: false,
      enableSwitchHotkey: false,
      enableMouseMode: false,

      /* browser, native-app */
      clippingHandlerName: 'browser',

      /* $FORMAT-A => 2018-10-11-1539236251*/
      /* $FORMAT-B => 20181011102009 */
      defaultClippingFolderFormat: '$FORMAT-A',
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

  /*
   * return false if not need to update, otherwise return true.
   */
  function update(k, v) {
    if (state.config) {
      if(state.config[k] === v){
        return false;
      } else {
        state.config[k] = v;
        MxWcStorage.set('config', state.config);
        return true;
      }
    } else {
      throw new Error("MxWcConfig: must load config first");
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
