import H             from '../helper.js';
import Config        from '../../src/js/lib/config.js';
import {CONFIG_KEYS} from '../../src/js/lib/config.js';
import Migration     from '../../src/js/background/migration.js';

describe('Migration', () => {

  describe('Migrate Config', () => {
    it('should fix keys', () => {
      let config = {};
      config = Migration.migrateConfig(config)
      H.assertEqual(config.version, Config.version);
      H.assertEqual(Object.keys(config).length, CONFIG_KEYS.length);
    });

    it('should fix keys from provided config', () => {
      let config = {};
      const fromConfig = {requestTimeout: 100}
      config = Migration.migrateConfig(config, fromConfig);
      H.assertEqual(config.version, Config.version);
      H.assertEqual(config.requestTimeout, 100);
    });
  });

});
