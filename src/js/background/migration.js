
(function(global, MxWcConfig, MxWcStorage, T, ENV) {
  "use strict";

  function needMigrate() {
    const {version} = ENV;
    if(T.isVersionGteq(version, '0.1.35')) {
      // Maybe delete those code.
      return false;
    } else {
      return true;
    }
  }

  function perform() {
    if(needMigrate()) {
      console.log('needMigrate');
      migrateConfigToV0134();
    }
  }

  // in version 0.1.34
  // clippingHandlerName -> clippingHandler
  // enableSwitchHotkey  -> hotkeySwitchEnabled
  // enableMouseMode     -> mouseModeEnabled
  // titleClippingFolderFormat -> titleStyleClippingFolderFormat
  function migrateConfigToV0134() {
    const {version} = ENV;
    if(T.isVersionGteq(version, '0.1.36')) {
      return ;
    }
    const key = 'mx-wc-config-migrated-0.1.34'
    MxWcStorage.get(key, false)
    .then((isMigrated) => {
      if(isMigrated) {
        console.debug('0.1.34 migrated');
      } else {
        MxWcConfig.load().then((config) => {
          if(config.clippingHandlerName) {
            // config version < 0.1.34
            config.clippingHandler =  T.capitalize(config.clippingHandlerName);
            config.hotkeySwitchEnabled = config.enableSwitchHotkey;
            config.mouseModeEnabled = config.enableMouseMode;
            config.titleStyleClippingFolderFormat = config.titleClippingFolderFormat;
            MxWcStorage.set('config', config);
            console.debug("0.1.34 migrate");
          } else {
            // config version >= 0.1.34
          }
          MxWcStorage.set(key, true);
        });
      }
    });
  }

  global.MxWcMigration = { perform: perform }

})(this, MxWcConfig, MxWcStorage, T, ENV);
