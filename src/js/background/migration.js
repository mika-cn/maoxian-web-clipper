
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../env.js'),
      require('../lib/tool.js'),
      require('../lib/storage.js'),
      require('../lib/config.js')
    );
  } else {
    // browser or other
    root.MxWcMigration = factory(
      root.MxWcENV,
      root.MxWcTool,
      root.MxWcStorage,
      root.MxWcConfig
    );
  }
})(this, function(ENV, T, MxWcStorage, MxWcConfig, undefined) {
  "use strict";

  function perform() {
    migrateV0134();
    migrateV0146();
  }

  function migrateV0134(){
    const {version} = ENV;
    if(T.isVersionGteq(version, '0.1.36')) {
      return ;
    }
    const key = 'mx-wc-config-migrated-0.1.34'
    MxWcStorage.get(key, false).then((isMigrated) => {
      if(isMigrated) {
        console.info(key);
      } else {
        migrateConfigToV0134();
        migrateStorageToV0134();
        MxWcStorage.set(key, true);
      }
    });
  }

  function migrateV0146() {
    const {version} = ENV;
    const key = 'mx-wc-config-migrated-0.1.46'
    MxWcStorage.get(key, false).then((isMigrated) => {
      if(isMigrated) {
        console.info(key);
      } else {
        migrateConfigToV0146();
        MxWcStorage.set(key, true);
      }
    });
  }

  function migrateStorageToV0134() {
    MxWcStorage.get('downloadFold')
    .then((v) => {
      MxWcStorage.set('downloadFolder', v);
    });
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
  function migrateConfigToV0134() {
    MxWcConfig.load().then((config) => {
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

        MxWcStorage.set('config', config);
        console.debug("0.1.34 migrate");
      } else {
        // config version >= 0.1.34
      }
    });
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
  function migrateConfigToV0146() {
    MxWcConfig.load().then((config) => {
      if (config.titleStyleClippingFolderFormat) {
        // version < 0.1.46
        if (config.saveTitleAsFilename) {
          config.mainFileName = '$TITLE';
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

        MxWcStorage.set('config', config);
        console.debug("0.1.46 migrate");

      } else {
        // version >= 0.1.46
      }
    });
  }

  return { perform: perform }

});
