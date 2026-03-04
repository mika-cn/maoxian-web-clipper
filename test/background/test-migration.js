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
      const migratedKeys = Object.keys(config);

      if (migratedKeys.length !== CONFIG_KEYS.length) {
        migratedKeys.forEach((name) => {
          if (CONFIG_KEYS.indexOf(name) == -1) {
            console.log("useless key => ", name);
          }
        });

        CONFIG_KEYS.forEach((name) => {
          if (migratedKeys.indexOf(name) == -1) {
            console.log("noMigrated key => ", name);
          }
        });
      }

      H.assertEqual(migratedKeys.length, CONFIG_KEYS.length);
    });

    it('should fix keys from provided config', () => {
      let config = {};
      const fromConfig = {requestTimeout: 100}
      config = Migration.migrateConfig(config, fromConfig);
      H.assertEqual(config.version, Config.version);
      H.assertEqual(config.requestTimeout, 100);
    });

    it('should remove "undefined" from tags', () => {
      let tags;
      tags = Migration.removeUndefinedAtBothSideOfTags([])
      H.assertTrue(tags instanceof Array)
      H.assertEqual(tags.length, 0)

      tags = Migration.removeUndefinedAtBothSideOfTags(['undefined'])
      H.assertEqual(tags[0], 'undefined')

      tags = Migration.removeUndefinedAtBothSideOfTags(['undefinedundefined'])
      H.assertEqual(tags[0], 'undefined')

      tags = Migration.removeUndefinedAtBothSideOfTags(['xundefined'])
      H.assertEqual(tags[0], 'x')

      tags = Migration.removeUndefinedAtBothSideOfTags(['undefinedx'])
      H.assertEqual(tags[0], 'x')

      tags = Migration.removeUndefinedAtBothSideOfTags(['undefinedxundefined'])
      H.assertEqual(tags[0], 'x')

      tags = Migration.removeUndefinedAtBothSideOfTags(['a', 'bundefined', 'c'])
      H.assertEqual(tags.length, 3)
      H.assertEqual(tags[0], 'a');
      H.assertEqual(tags[1], 'b');
      H.assertEqual(tags[2], 'c');

      tags = Migration.removeUndefinedAtBothSideOfTags(['aundefined', 'b', 'a'])
      H.assertEqual(tags.length, 2)
      H.assertEqual(tags[0], 'a');
      H.assertEqual(tags[1], 'b');

      tags = Migration.removeUndefinedAtBothSideOfTags(['a', 'b', 'aundefined'])
      H.assertEqual(tags.length, 2)
      H.assertEqual(tags[0], 'a');
      H.assertEqual(tags[1], 'b');
    });
  });

});
