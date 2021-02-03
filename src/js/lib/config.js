
import T           from './tool.js';
import MxWcStorage from './storage.js';

const VERSION = '1.4';
const state = {};

/** WARNING
 * Be careful here! If we add or modify any config item here,
 * we should apply these changes to migration.js too.
 * Because user's config is still the old one.
 */

function getDefault(){
  return {
    version: VERSION,
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
    autoInputLastCategory: true,
    rememberSelection: false,

    allowFileSchemeAccess: false,

    //=====================================
    // Advanced
    //=====================================
    /* unit: seconds */
    requestTimeout: 60,
    requestMaxTries: 3,
    /* noReferrer, origin, originWhenCrossOrigin, unsafeUrl */
    requestReferrerPolicy: 'originWhenCrossOrigin',
    /* cache */
    requestCacheSize: 80,
    requestCacheCss: true,
    requestCacheImage: true,
    requestCacheWebFont: false,

    /* misc */
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
    saveInfoFile: true,
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

    //=====================================
    // Backup
    //=====================================
    backupSettingPageConfig: true,
    backupHistoryPageConfig: true,
    backupAssistantData: true,
    backupSelectionData: true,
  };
}

export const CONFIG_KEYS = Object.keys(getDefault())

export const API_SETTABLE_KEYS = [
  'rootFolder',

  'defaultCategory',
  'clippingFolderName',

  'mainFileFolder',
  'mainFileName',

  'saveInfoFile',
  'infoFileFolder',
  'infoFileName',

  'saveTitleFile',
  'titleFileFolder',
  'titleFileName',

  'frameFileFolder',
  'assetFolder',
];



/*
 * @returns a promise
 */
function load() {
  return new Promise(function(resolv, _) {
    MxWcStorage.get('config', getDefault())
      .then((config) => {
        state.config = config;
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
    const defaultConfig = getDefault();
    state.config = defaultConfig;
    MxWcStorage.set('config', state.config);
    resolve(state.config);
  });
}

/*
 * Fix config's keys
 */
function fixKeys(config, fromConfig = {}){
  const defaultConfig = getDefault();
  for(const k in defaultConfig){
    if(!config.hasOwnProperty(k)){
      if (fromConfig.hasOwnProperty(k)) {
        config[k] = fromConfig[k];
      } else {
        config[k] = defaultConfig[k];
      }
    }
  }
  return config;
}

/**
 * When config is saved into storage,
 * their keys became ordered. which
 * is not a expected behavior when
 * you show them.
 *
 * WARNING: it'll return a new Object
 */
function unsort(config) {
  const r = {};
  CONFIG_KEYS.forEach((k) => {
    r[k] = config[k];
  })
  return r;
}

function isMigratable(config) {
  if (config.version) {
    if (T.isVersionLteq(config.version, VERSION)) {
      return {ok: true}
    } else {
      return {
        ok: false,
        errMsg: `Configuration invalid: version (v${config.version}) is too big , Current extension only supports v${VERSION}.`
      }
    }
  } else {
    return {
      ok: false,
      errMsg:"Configuration Invalid: it must has a 'version' property"
    };
  }
}

const Config = {
  defaultVersion: '0.0',
  version: VERSION,
  load: load,
  update: update,
  reset: reset,
  getDefault: getDefault,
  fixKeys: fixKeys,
  unsort: unsort,
  isMigratable: isMigratable,
}

export default Config;
