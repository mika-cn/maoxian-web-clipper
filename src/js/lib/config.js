
import T           from './tool.js';
import MxWcStorage from './storage.js';

const VERSION = '2.14';
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

    htmlSaveClippingInformation: false,
    htmlCustomBodyBgCssEnabled: false,
    htmlCustomBodyBgCssValue: "#000000",
    htmlCompressCss: false,

    htmlCaptureImage    : 'saveAll', // saveAll | saveCurrent
    htmlCaptureAudio    : 'remove',  // saveAll | remove | saveCurrent
    htmlCaptureVideo    : 'remove',  // saveAll | remove | saveCurrent
    htmlCaptureApplet   : 'remove',  // saveAll | remove
    htmlCaptureEmbed    : 'saveImage',  // saveAll | saveImage | remove | filter
    htmlCaptureObject   : 'saveImage',  // saveAll | saveImage | remove | filter
    htmlCaptureIcon     : 'remove',  // saveAll | saveFavicon | remove

    htmlCaptureCssRules : 'saveUsed',// saveAll | saveUsed
    htmlCaptureWebFont  : 'remove',  // saveAll | filterList | remove |
    htmlCaptureCssImage : 'remove',  // saveAll | remove

    htmlEmbedFilter: "<images>",
    htmlObjectFilter: "<images>",
    htmlWebFontFilterList: "woff2|woff|otf|ttf",

    markdownTemplate: "\n{{content}}\n",
    markdownOptionHeadingStyle: "atx",      // setext | atx
    markdownOptionHr: "* * *",              // Any [Thematic break](http://spec.commonmark.org/0.27/#thematic-breaks)
    markdownOptionBulletListMarker: "*",    // - | + | *
    markdownOptionCodeBlockStyle: "fenced", // indented | fenced
    markdownOptionFence: "```",             // ``` | ~~~
    markdownOptionEmDelimiter: "_",         // _ | *
    markdownOptionStrongDelimiter: "**",    // ** | __
    markdownOptionLinkStyle: "inlined",     // inlined | referenced
    markdownOptionLinkReferenceStyle: "full", // full | collapsed | shortcut
    markdownOptionPreformattedCode: false,  // false | true
    markdownOptionFormulaBlockWrapper: "padSameLine", // sameLine, padSameLine, multipleLine, mathCodeBlock

    // control
    mouseModeEnabled: false,
    selectSaveFormatOnMenus: false,
    autoInputLastCategory: true,
    autoInputLastTags: true,
    rememberSelection: false,

    allowFileSchemeAccess: false,

    shortcutSlot0: '_openLastClipping',
    shortcutSlot1: '_clipAsDefault',
    shortcutSlot2: '_clipAsHTML',
    shortcutSlot3: '_clipAsMarkdown',
    shortcutSlot4: '_doNothing',
    shortcutSlot5: '_doNothing',
    shortcutSlot6: '_doNothing',
    shortcutSlot7: '_doNothing',
    shortcutSlot8: '_doNothing',
    shortcutSlot9: '_doNothing',

    // {nameA: {exec, args}, nameB: {exec, args}}
    userCommandsText: '{\n  "doNothing": {"exec": "doNothing"}\n}',

    //=====================================
    // Advanced
    //=====================================
    /* unit: seconds */
    requestTimeout: 300,
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
    autoRunContentScripts: false,

    //=====================================
    // Storage
    //=====================================

    // "clippingHandlerName" is the old key
    // and it's not be used anymore.
    //
    // 'Browser', 'NativeApp' or 'WizNotePlus'
    clippingHandler: 'Browser',

    // 'html' or 'md'
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
     * ======== Frame File ========
     *   embed HTML file
     */
    frameFileFolder: '$CLIPPING-PATH/frames',
    frameFileName: '$TIME-INTSEC-$MD5URL.frame.html',

    /**
     * ======== Asset Files ========
     *   picture, icon, webfont, style
     */
    assetFolder: '$CLIPPING-PATH/assets',
    assetFileName: '$TIME-INTSEC-$MD5URL$EXT',

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

  // storage keys
  'clippingHandler',
  'saveFormat',

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
  'frameFileName',

  'assetFolder',
  'assetFileName',

  // html content relative keys
  "htmlSaveClippingInformation",
  "htmlCustomBodyBgCssEnabled",
  "htmlCustomBodyBgCssValue",
  "htmlCompressCss",

  "htmlCaptureImage",
  "htmlCaptureAudio",
  "htmlCaptureVideo",
  "htmlCaptureApplet",
  "htmlCaptureEmbed",
  "htmlCaptureObject",
  "htmlCaptureIcon",

  "htmlCaptureCssRules",
  "htmlCaptureWebFont",
  "htmlCaptureCssImage",

  "htmlEmbedFilter",
  "htmlObjectFilter",
  "htmlWebFontFilterList",

  // markdown relative keys
  "markdownTemplate",
  "markdownOptionHeadingStyle",
  "markdownOptionHr",
  "markdownOptionBulletListMarker",
  "markdownOptionCodeBlockStyle",
  "markdownOptionFence",
  "markdownOptionEmDelimiter",
  "markdownOptionStrongDelimiter",
  "markdownOptionLinkStyle",
  "markdownOptionFormulaBlockWrapper",


  // request keys
  'requestTimeout',
  'requestMaxTries',
  'requestReferrerPolicy',
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

/*
 * Only keep those api settable keys.
 * WARNING: it'll return a new Object
 */
function filterAPISettableKeys(config = {}) {
  const r = {}
  for (const key in config) {
    if (API_SETTABLE_KEYS.indexOf(key) > -1) {
      r[key] = config[key];
    }
  }
  return r;
}

// ======================================
// validations
// ======================================

/*
 * @returns {Object} it
 *   {Boolean} it.ok
 *   {String} it.errI18n
 */
function validate(key, value, config) {
  const it = (config || state.config)
  if (it) {
    switch(key) {
      case 'rootFolder':
      case 'defaultCategory':
      case 'clippingFolderName':
      case 'mainFileName':
      case 'assetFileName':
      case 'frameFileName':
      case 'infoFileName':
      case 'titleFileName':
      case 'markdownTemplate':
      case 'clippingJsPath':
      case "htmlEmbedFilter":
      case "htmlObjectFilter":
      case "htmlWebFontFilterList":
      case "shortcutSlot0":
      case "shortcutSlot1":
      case "shortcutSlot2":
      case "shortcutSlot3":
      case "shortcutSlot4":
      case "shortcutSlot5":
      case "shortcutSlot6":
      case "shortcutSlot7":
      case "shortcutSlot8":
      case "shortcutSlot9":
        return shouldNotEmpty(value);
      case 'mainFileFolder':
      case 'assetFolder':
      case 'frameFileFolder':
      case 'infoFileFolder':
      case 'titleFileFolder':
        return shouldStartsWithRootFolder(it.rootFolder, value);
      case 'userCommandsText':
        return validateAllFns([shouldNotEmpty, isValidJSON], value);
      default: {
        return {ok: true}
      }
    }
  } else {
    throw new Error("MxWcConfig: must load config first or pass config as third argument");
  }
}

function validateAllFns(fns, value) {
  for (const fn of fns) {
    const r = fn(value)
    if (!r.ok) {
      return r;
    }
  }
  return {ok: true}
}

function shouldNotEmpty(value) {
  if (typeof value == 'string' && value.trim() == "") {
    return {ok: false, errI18n: 'error.not-empty'}
  } else {
    return {ok: true}
  }
}

function shouldStartsWithRootFolder(rootFolder, value) {
  const prefixes = [
    '$CLIPPING-PATH',
    '$CATEGORY-PATH',
    '$STORAGE-PATH',
    '$ROOT-FOLDER',
    rootFolder,
  ];
  if (prefixes.findIndex((it) => value.startsWith(it)) > -1) {
    return {ok: true}
  } else {
    return {ok: false, errI18n: "error.saving-folder-prefix"}
  }
}


function isValidJSON(value) {
  try {
    JSON.parse(value);
    return {ok: true}
  } catch(e) {
    return {ok: false, errI18n: "error.invalid-json"}
  }
}

const Config = {
  defaultVersion: '0.0',
  version: VERSION,
  load: load,
  validate: validate,
  update: update,
  reset: reset,
  getDefault: getDefault,
  fixKeys: fixKeys,
  unsort: unsort,
  isMigratable: isMigratable,
  filterAPISettableKeys: filterAPISettableKeys,
}

export default Config;
