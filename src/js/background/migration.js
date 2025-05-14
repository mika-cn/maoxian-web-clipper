"use strict";

import ENV         from '../env.js';
import T           from '../lib/tool.js';
import MxWcStorage from '../lib/storage.js';
import MxWcConfig  from '../lib/config.js';
import ExtApi      from '../lib/ext-api.js';

async function perform() {
  await migrateOldVersion();
  await migrate();
}

async function migrate() {
  // migrate config
  let config = await MxWcConfig.load();
  config = migrateConfig(config);
  await MxWcStorage.set('config', config);

  // migrate clippings
  await migrateClippings();

  // migrate commands
  await migrateCommands();

  await migrateTags();
}

/*
 * WARNING:
 *   "config" may don't have all configuration keys.
 */
function migrateConfig(config, fromConfig = {}) {
  const version = (config.version || MxWcConfig.defaultVersion);
  const migration = ConfigMigration[version];
  if (migration) {
    return migrateConfig(migration(config), fromConfig);
  } else {
    // Just in case we add new key and forget to do migration.
    // But we should not account to this.
    // Do migration everytime you change config's structure.
    return MxWcConfig.fixKeys(config, fromConfig);
  }
}

const ConfigMigration = {};

ConfigMigration['2.16'] = function(config) {
  config.version = '2.17';
  config.requestCredentials = 'omit';
  return config;
}

ConfigMigration['2.15'] = function(config) {
  config.version = '2.16';
  // If we did delete these items on test versions
  // reset them to default values.
  if (!config.hasOwnProperty('requestCacheCss')) {
    config.requestCacheCss = true;
  }
  if (!config.hasOwnProperty('requestCacheImage')) {
    config.requestCacheImage = true;
  }
  if (!config.hasOwnProperty('requestCacheWebFont')) {
    config.requestCacheWebFont = false;
  }
  return config;
}

ConfigMigration['2.14'] = function(config) {
  config.version = '2.15';

  const oldValues = [
    "noReferrer",
    "origin",
    "originWhenCrossOrigin",
    "unsafeUrl",
  ];

  const dict = {
    noReferrer: "no-referrer",
    origin: "origin",
    originWhenCrossOrigin: "origin-when-cross-origin",
    unsafeUrl: "unsafe-url",
  };

  const defaultReferrerPolicy = "strict-origin-when-cross-origin";

  let newValue;
  if (oldValues.indexOf(config.requestReferrerPolicy) < 0) {
    newValue = defaultReferrerPolicy;
  } else {
    newValue = dict[config.requestReferrerPolicy] || defaultReferrerPolicy;
  }

  config.requestReferrerPolicy = newValue;
  config.requestCache = 'default';
  config.requestCredentials = 'same-origin';

  // We can't utilize webRequest API anymore
  // delete relative items
  delete config.requestCacheSize;
  // Note that: We deleted these on test versions
  // delete config.requestCacheCss;
  // delete config.requestCacheImage;
  // delete config.requestCacheWebFont;

  return config;
}

ConfigMigration['2.13'] = function(config) {
  config.version = '2.14';
  config.userCommandsText = '{\n  "doNothing": {"exec": "doNothing"}\n}';
  return config;
}

ConfigMigration['2.12'] = function(config) {
  config.version = '2.13';
  config.shortcutSlot0 = '_openLastClipping';
  config.shortcutSlot1 = '_clipAsDefault';
  config.shortcutSlot2 = '_clipAsHTML';
  config.shortcutSlot3 = '_clipAsMarkdown';
  config.shortcutSlot4 = '_doNothing';
  config.shortcutSlot5 = '_doNothing';
  config.shortcutSlot6 = '_doNothing';
  config.shortcutSlot7 = '_doNothing';
  config.shortcutSlot8 = '_doNothing';
  config.shortcutSlot9 = '_doNothing';
  return config;
}

ConfigMigration['2.11'] = function(config) {
  config.version = '2.12';
  config.selectSaveFormatOnMenus = config.inputFieldSaveFormatEnabled;
  delete config.inputFieldSaveFormatEnabled;
  return config;
}

ConfigMigration['2.10'] = function(config) {
  config.version = '2.11';
  config.markdownOptionFormulaBlockWrapper = "padSameLine";
  return config;
}

ConfigMigration['2.9'] = function(config) {
  config.version = '2.10';
  config.autoInputLastTags = true;
  return config;
}

ConfigMigration['2.8'] = function(config) {
  config.version = '2.9';

  config.markdownOptionHeadingStyle = "atx";
  config.markdownOptionHr = "* * *";
  config.markdownOptionBulletListMarker = "*";
  config.markdownOptionCodeBlockStyle = "fenced";
  config.markdownOptionFence = "```";
  config.markdownOptionEmDelimiter = "_";
  config.markdownOptionStrongDelimiter = "**";
  config.markdownOptionLinkStyle = "inlined";
  config.markdownOptionLinkReferenceStyle = "full";
  config.markdownOptionPreformattedCode = false;
  return config;
}


ConfigMigration['2.7'] = function(config) {
  config.version = '2.8';

  // renamed on version 2.1
  delete config.saveIcon;
  delete config.saveWebFont;
  delete config.saveCssImage;

  // renamed on version 2.7
  delete config.customBodyBgCssEnabled
  delete config.customBodyBgCssValue

  return config;
}


ConfigMigration['2.6'] = function(config) {
  config.version = '2.7';
  config.htmlCustomBodyBgCssEnabled = config.customBodyBgCssEnabled;
  config.htmlCustomBodyBgCssValue = config.customBodyBgCssValue;
  return config;
}

ConfigMigration['2.5'] = function(config) {
  config.version = '2.6';
  delete config.htmlWebFontFilter;
  config.htmlWebFontFilterList = "woff2|woff|otf|ttf";
  return config;
}

ConfigMigration['2.4'] = function(config) {
  config.version = '2.5';
  config.htmlWebFontFilter = 'woff,woff2';
  return config;
}

ConfigMigration['2.3'] = function(config) {
  config.version = '2.4';
  // change default value
  config.htmlCaptureEmbed  = 'saveImage';
  config.htmlCaptureObject = 'saveImage';
  return config;
}

ConfigMigration['2.2'] = function(config) {
  config.version = '2.3';
  config.htmlCompressCss = false;
  return config;
}

ConfigMigration['2.1'] = function(config) {
  config.version = '2.2';
  config.htmlCaptureCssRules = 'saveAll';
  return config;
}

ConfigMigration['2.0'] = function(config) {
  config.version = '2.1';
  const getValue = (checked) => checked ? 'saveAll' : 'remove';
  config.htmlCaptureIcon      = getValue(config.saveIcon);
  config.htmlCaptureWebFont   = getValue(config.saveWebFont);
  config.htmlCaptureCssImage  = getValue(config.saveCssImage);
  config.htmlCaptureImage = 'saveAll';
  return config;
}

ConfigMigration['1.9'] = function(config) {
  config.version = '2.0';
  config.htmlCaptureAudio  = 'remove';
  config.htmlCaptureVideo  = 'remove';
  config.htmlCaptureApplet = 'remove';
  config.htmlCaptureEmbed  = 'filter';
  config.htmlCaptureObject = 'filter';

  config.htmlEmbedFilter   = "<images>";
  config.htmlObjectFilter  = "<images>";
  return config;
}

ConfigMigration['1.8'] = function(config) {
  config.version = '1.9';
  config.autoRunContentScripts = false;
  return config;
}

ConfigMigration['1.7'] = function(config) {
  config.version = '1.8';
  delete config.hotkeySwitchEnabled;

  // these three items hasn't deleted on migration[1.6]
  delete config.mdSaveClippingInformation;
  delete config.mdFrontMatterEnabled;
  delete config.mdFrontMatterTemplate;

  return config;
}

ConfigMigration['1.6'] = function(config) {
  config.version = '1.7';
  const parts = ["\n{{content}}\n"];
  if (config.mdSaveClippingInformation) {
    const clippingInfoTemplate = `
---------------------------------------------------

{{i18n_original_url}}: [{{i18n_access}}]({{url}})

{{i18n_created_at}}: {{createdAt}}

{{i18n_category}}: {{category}}{{^category}}{{i18n_none}}{{/category}}

{{i18n_tags}}: {{#trimFn}}{{#tags}}\`{{.}}\`, {{/tags}}{{/trimFn}}{{^tags}}{{i18n_none}}{{/tags}}
`;
    parts.push(clippingInfoTemplate);
  }

  if (config.mdFrontMatterEnabled) {
    try {
      const regExp = /\$\{([^\$\}]+)\}/mg;
      const frontMatterTemplate = config.mdFrontMatterTemplate.replace(regExp, (match, key) => {
        let it = `{{${key}}}`
        if (key == 'tags') {
          it = "\n{{#tags}}\n - {{.}}\n{{/tags}}";
          it += "\n{{^tags}}\n - {{i18n_none}}\n{{/tags}}";
        }
        if (key == 'category') {
          it += "{{^category}}{{i18n_none}}{{/category}}";
        }
        if (key == 'title') {
          it += "{{^title}}-{{/title}}";
        }
        return it;
      });

      parts.unshift(frontMatterTemplate);
    }catch(e) {}
  }

  config.markdownTemplate = parts.join("\n\n");
  return config;
}

// 1.5 => 1.6
ConfigMigration['1.5'] = function(config) {
  config.version = '1.6';
  config.assetFileName = '$TIME-INTSEC-$MD5URL$EXT';
  config.frameFileName = '$TIME-INTSEC-$MD5URL.frame.html';
  return config;
}

// 1.4 => 1.5
ConfigMigration['1.4'] = function(config) {
  config.version = '1.5';
  config.customBodyBgCssEnabled = false;
  config.customBodyBgCssValue = "";
  return config;
}

// 1.3 => 1.4
ConfigMigration['1.3'] = function(config) {
  config.version = '1.4';
  config.autoInputLastCategory = true;
  return config;
}

// 1.2 => 1.3
ConfigMigration['1.2'] = function(config) {
  config.version = '1.3';
  config.requestCacheSize = 80;
  config.requestCacheCss = true;
  config.requestCacheImage = true;
  config.requestCacheWebFont = false;
  return config;
}


// 1.1 => 1.2
ConfigMigration['1.1'] = function(config) {
  //console.info("Migrating config from 1.1 to 1.2")
  config.version = '1.2';
  return config;
}

// 1.0 => 1.1
ConfigMigration['1.0'] = function(config) {
  //console.info("Migrating config from 1.0 to 1.1")
  config.version = '1.1';
  config.backupSettingPageConfig = true;
  config.backupHistoryPageConfig = true;
  config.backupAssistantData = true;
  config.backupSelectionData = true;
  return config;
}

// 0.0 => 1.0
ConfigMigration['0.0'] = function(config) {
  //console.info("Migrating config from 0.0 to 1.0")
  config.version = '1.0';
  return config;
}


// =====================================================
async function migrateTags() {
  await fixUndefinedInBothSidesOfTags();
}

// A bug that can't properly split tagstr
// cause some tags prefixied or sufixed with 'undefined'
// fix these tags
//
// begin at version: 0.7.0
// affected versions:
//   - 0.7.0
//   - 0.7.10 MV3 (test version)
//   - 0.7.11 MV3 (test version)
//   - 0.7.70 MV3 (first release)
async function fixUndefinedInBothSidesOfTags() {
  const key = 'mx-wc-tag-migrated-undefined-in-both-sides'
  const isMigrated = await MxWcStorage.get(key, false);
  if (isMigrated) {
    console.info(key);
  } else {
    const oldTags = await MxWcStorage.get('tags', []);
    const newTags = removeUndefinedAtBothSideOfTags(oldTags)
    await MxWcStorage.set('tags', newTags);
    await MxWcStorage.set(key, true);
  }
}

function removeUndefinedAtBothSideOfTags(oldTags) {
  const newTags = [];
  const allIsUndefined = /^(undefined)+$/
  oldTags.forEach((tag) => {
    let newTag;
    if (tag.match(allIsUndefined)) {
      newTag = 'undefined'
    } else {
      let it = tag;
      if (it.startsWith('undefined')) {
        it = it.replace(/^undefined/, '')
      }
      if (it.endsWith('undefined')) {
        it = it.replace(/undefined$/, '')
      }
      newTag = it;
    }
    if (newTags.indexOf(newTag) < 0) {
      newTags.push(newTag);
    }
  });
  return newTags;
}


// =====================================================

async function migrateClippings() {
  await deleteClippingPaths();
}

async function deleteClippingPaths() {
  const key = 'mx-wc-clipping-migrated-delete-paths'
  const isMigrated = await MxWcStorage.get(key, false);
  if (isMigrated) {
    console.info(key);
  } else {
    const clippings = await MxWcStorage.get('clips', []);
    clippings.forEach((it) => {
      delete it.paths;
    })
    await MxWcStorage.set('clips', clippings);
    await MxWcStorage.set(key, true);
  }
}

// =====================================================

async function migrateCommands() {
  await moveOldShortcutToSlot();
}

async function moveOldShortcutToSlot() {
  const key = 'mx-wc-command-migrated-move-old-shortcut-to-slot'
  const isMigrated = await MxWcStorage.get(key, false);
  if (isMigrated) {
    console.info(key);
    return;
  }

  const commands = await ExtApi.getAllCommands();

  for (const command of commands) {

    let targetSlot, shortcut;
    switch(command.name) {
      case 'open-clipping': {
        targetSlot = "slot-0";
        shortcut = command.shortcut;
        break;
      }
      case 'clip-as-default': {
        targetSlot = "slot-1";
        shortcut = command.shortcut;
        break;
      }
      case 'clip-as-html': {
        targetSlot = "slot-2";
        shortcut = command.shortcut;
        break;
      }
      case 'clip-as-md': {
        targetSlot = "slot-3";
        shortcut = command.shortcut;
        break;
      }
      default: break;
    }

    if (targetSlot && shortcut) {
      try {
        // move old shortcut to slot
        await ExtApi.updateCommand({
          name: targetSlot,
          shortcut: shortcut
        });
        // unset old shortcut
        await ExtApi.updateCommand({
          name: command.name,
          shortcut: ""
        });
      } catch(e) {
        console.debug(e);
      }
    }
  }

  await MxWcStorage.set(key, true);
}

// =====================================================


async function migrateOldVersion() {
  await migrateV0134();
  await migrateV0146();
  await migrateV0147();
}

async function migrateV0134(){
  const {version} = ENV;
  if(T.isVersionGteq(version, '0.1.36')) {
    return ;
  }
  const key = 'mx-wc-config-migrated-0.1.34'
  const isMigrated = await MxWcStorage.get(key, false);
  if(isMigrated) {
    console.info(key);
  } else {
    await migrateConfigToV0134();
    await migrateStorageToV0134();
    await MxWcStorage.set(key, true);
  }
}

async function migrateV0146() {
  const {version} = ENV;
  const key = 'mx-wc-config-migrated-0.1.46'
  const isMigrated = await MxWcStorage.get(key, false);
  if(isMigrated) {
    console.info(key);
  } else {
    await migrateConfigToV0146();
    await MxWcStorage.set(key, true);
  }
}

async function migrateV0147() {
  const {version} = ENV;
  const key = 'mx-wc-config-migrated-0.1.47'
  const isMigrated = await MxWcStorage.get(key, false);
  if(isMigrated) {
    console.info(key);
  } else {
    await migrateConfigToV0147();
    await MxWcStorage.set(key, true);
  }
}

async function migrateStorageToV0134() {
  const v = await MxWcStorage.get('downloadFold');
  if (v) {
    await MxWcStorage.set('downloadFolder', v);
  }
}

// in version 0.1.34
// Changed Names
//   clippingHandlerName -> clippingHandler
//   enableSwitchHotkey  -> hotkeySwitchEnabled
//   enableMouseMode     -> mouseModeEnabled
//   titleClippingFolderFormat -> titleStyleClippingFolderFormat
//   saveTitleAsFoldName -> titleStyleClippingFolderEnabled
//
// Changed Values
//
//   assetPath
//     $CLIP-FOLD -> $CLIPPING-PATH
//     $MX-WC -> $STORAGE-PATH
//
//   clippingJsPath
//     $MX-WC -> $STORAGE-PATH
//
//
async function migrateConfigToV0134() {
  const config = await MxWcConfig.load()
  if(config.clippingHandlerName) {
    // config version < 0.1.34
    config.clippingHandler =  T.capitalize(config.clippingHandlerName);
    if(config.clippingHandlerName == 'native-app') {
      config.handlerNativeAppEnabled = true;
    }

    config.hotkeySwitchEnabled = config.enableSwitchHotkey;
    config.mouseModeEnabled = config.enableMouseMode;
    config.titleStyleClippingFolderFormat = config.titleClippingFolderFormat;
    config.titleStyleClippingFolderEnabled = config.saveTitleAsFoldName;

    config.assetPath = config.assetPath.replace('$CLIP-FOLD', '$CLIPPING-PATH').replace('$MX-WC', '$STORAGE-PATH');
    config.clippingJsPath = config.clippingJsPath.replace('$MX-WC', '$STORAGE-PATH');

    await MxWcStorage.set('config', config);
    console.debug("0.1.34 migrate");
  } else {
    // config version >= 0.1.34
  }
}

// in version 0.1.46
//
// New configs
//
//   mainFileName
//     saveTitleAsFilename -> $TITLE
//
//   saveTitleFile
//     saveTitleAsFilename -> false
//     titleStyleClippingFolderEnabled -> false
//     else -> true
//
//   clippingFolderName
//
// Renames
//   assetPath -> assetFolder
//   saveClippingInformation
//     -> htmlSaveClippingInformation
//     -> mdSaveClippingInformation
async function migrateConfigToV0146() {
  const config = await MxWcConfig.load()
  if (config.titleStyleClippingFolderFormat) {
    // version < 0.1.46

    // new attributes (set default value)
    config.mainFileName = 'index.$FORMAT';
    config.saveTitleFile = true;
    config.clippingFolderName = '$YYYY-$MM-$DD-$TIME-INTSEC';

    if (config.saveTitleAsFilename) {
      config.mainFileName = '$TITLE.$FORMAT';
      config.saveTitleFile = false;
    }

    if (config.titleStyleClippingFolderEnabled) {
      config.saveTitleFile = false;
    }

    // clippingFolderName
    let arr = [];
    switch(config.defaultClippingFolderFormat) {
      case '$FORMAT-B':
        arr.push('$YYYY$MM$DD$HH$mm$SS');
        break;
      case '$FORMAT-C':
        arr.push('$TIME-INTSEC')
        break;
      default:
        arr.push('$YYYY-$MM-$DD-$TIME-INTSEC');
    }

    if (config.titleStyleClippingFolderEnabled) {
      if (config.titleClippingFolderFormat === '$FORMAT-B') {
        config.clippingFolderName = '$TITLE';
      } else {
        arr.push('$TITLE');
        config.clippingFolderName = arr.join('-');
      }
    }

    config.assetFolder = config.assetPath;
    config.htmlSaveClippingInformation = config.saveClippingInformation;
    config.mdSaveClippingInformation = config.saveClippingInformation;

    await MxWcStorage.set('config', config);
    console.debug("0.1.46 migrate");

  } else {
    // version >= 0.1.46
  }
}

//
// Fix migration of 0.1.46
//
// fix mainFileName $TITLE => $TITLE.$FORMAT
//
async function migrateConfigToV0147() {
  const config = await MxWcConfig.load();
  if (config.mainFileName === '$TITLE') {
    config.mainFileName = '$TITLE.$FORMAT';
    await MxWcStorage.set('config', config);
  }
  console.debug("0.1.47 migrate");
}

export default {
  perform,
  migrateConfig,
  removeUndefinedAtBothSideOfTags, // test only
}
