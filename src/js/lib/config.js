;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(require('./storage.js'));
  } else {
    // browser or other
    root.MxWcConfig = factory(root.MxWcStorage);
  }
})(this, function(MxWcStorage, undefined) {

  "use strict";

  const state = {};

  function getDefault(){
    return {

      /* Is handler enabled? */
      handlerBrowserEnabled: true,
      handlerNativeAppEnabled: false,
      handlerWizNotePlusEnabled: false,

      //=====================================
      // General
      //=====================================

      // content relative
      saveWebFont: false,
      saveCssImage: false,
      saveClippingInformation: true,
      saveDomainAsTag: false,

      // control
      hotkeySwitchEnabled: true,
      mouseModeEnabled: false,
      inputFieldSaveFormatEnabled: false,

      allowFileSchemeAccess: false,

      //=====================================
      // Storage
      //=====================================

      // "clippingHandlerName" is the old key
      // and it's not be used anymore.
      clippingHandler: 'Browser',

      saveFormat: 'html',

      // ======== Local path ==========
      rootFolder: 'mx-wc',
      /* $STORAGE-PATH */
      /* $CLIPPING-PATH */
      assetPath: '$CLIPPING-PATH/assets',
      saveTitleAsFilename: false,
      defaultCategory: 'default',

      /* $FORMAT-A => 2018-10-11-1539236251*/
      /* $FORMAT-B => 20181011102009 */
      /* $FORMAT-C => 1539236251 */
      defaultClippingFolderFormat: '$FORMAT-A',

      titleStyleClippingFolderEnabled: false,
      /* $FORMAT-A => $default-clipping-folder + $title */
      /* $FORMAT-B => $title */
      titleStyleClippingFolderFormat: '$FORMAT-A',




      //=====================================
      // Offine pages
      //=====================================
      offlinePageHandler: 'Browser',
      autogenerateClippingJs: false,
      clippingJsPath: '$STORAGE-PATH/history/clippings.js',

      //=====================================
      // Auto refresh history
      //=====================================
      refreshHistoryHandler: 'NativeApp',
      autoRefreshHistory: false,
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
    return new Promise(function(resolve, _) {
      const deafultConfig = getDefault();
      state.config = defaultConfig;
      MxWcStorage.set('config', state.config);
      resolve(state.config);
    });
  }

  return {
    load: load,
    update: update,
    reset: reset,
    getDefault: getDefault
  }
});
