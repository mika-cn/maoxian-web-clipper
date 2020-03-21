  "use strict";

  import MxWcStorage from './storage.js';

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
      saveDomainAsTag: false,

      saveIcon: false,
      saveWebFont: false,
      saveCssImage: false,
      htmlSaveClippingInformation: false,

      mdSaveClippingInformation: false,
      mdFrontMatterEnabled: false,
      mdFrontMatterTemplate: "---\ntitle: ${title}\ncategory: ${category}\ntags: ${tags}\ncreated_at: ${createdAt}\noriginal_url: ${url}\n---",

      // control
      hotkeySwitchEnabled: false,
      mouseModeEnabled: false,
      inputFieldSaveFormatEnabled: false,
      rememberSelection: false,

      allowFileSchemeAccess: false,

      //=====================================
      // Advanced
      //=====================================
      /* unit: seconds */
      requestTimeout: 40,
      /* noReferrer, origin, originWhenCrossOrigin, unsafeUrl */
      requestReferrerPolicy: 'originWhenCrossOrigin',
      communicateWithThirdParty: false,

      //=====================================
      // Storage
      //=====================================

      // "clippingHandlerName" is the old key
      // and it's not be used anymore.
      clippingHandler: 'Browser',

      saveFormat: 'html',

      // ======== Local path ==========
      rootFolder: 'mx-wc',

      /**
       * ======== Variables ========
       *
       * $STORAGE-PATH  => downloadPath + rootFolder
       * $CATEGORY-PATH => downloadPath + rootFolder + categoryFolder
       * $CLIPPING-PATH => downloadPath + rootFolder + categoryFolder + clippingFolder
       *
       * $TITLE
       * $DOMAIN
       *
       * $YYYY => year (4 digits, e.g. 2018)
       * $YY   => year (2 digits, e.g. 18)
       * $MM   => month (2 digits, 01 ~ 12)
       * $DD   => day (2 digits, 01 ~ 31)
       * $HH   => hour (2 digits, 00 ~ 23)
       * $mm   => minute (2 digits, 00 ~ 59)
       * $SS   => second (2 digits, 00 ~ 59)
       * $TIME-INTSEC => time in seconds.
       *
       */

      /**
       * ======== Main File ========
       *   HTML file or Markdown file.
       */
      mainFileFolder: '$CLIPPING-PATH',
      /* $TITLE */
      mainFileName: 'index.$FORMAT',

      /**
       * ======== Frame File ========
       *   embed HTML file
       */
      frameFileFolder: '$CLIPPING-PATH/frames',

      /**
       * ======== Info File ========
       *   A json file which stores clipping information.
       */
      infoFileFolder: '$CLIPPING-PATH',
      infoFileName: 'index.json',


      /**
       * ======== Title File ========
       *   A Empty file which contains title in it's name.
       */
      saveTitleFile: true,
      titleFileFolder: '$CLIPPING-PATH',
      titleFileName: 'a-title_$TITLE',

      /**
       * ======== Asset Files ========
       *   picture, icon, webfont, style
       */
      assetFolder: '$CLIPPING-PATH/assets',

      /* $NONE */
      /* $DOMAIN */
      defaultCategory: 'default',

      clippingFolderName: '$YYYY-$MM-$DD-$TIME-INTSEC',

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

      //=====================================
      // MxWc Assistant
      //=====================================
      assistantEnabled: false,
      autoUpdatePublicPlan: false,
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

  const Config = {
    load: load,
    update: update,
    reset: reset,
    getDefault: getDefault
  }

  export default Config;
