
import H from '../helper.js';
import T from '../../src/js/lib/tool.js';
import Config from '../../src/js/lib/config.js';
import Render from '../../src/js/clipping/storage-config-render.js';
import StorageConfigDefault from '../../src/js/clipping/storage-config-default.js';
import StorageConfigWizNotePlus from '../../src/js/clipping/storage-config-wiznoteplus.js';

describe("StorageConfigRender", () => {

  it('storageConfig: default', () => {
    const storageConfig = StorageConfigDefault.get({config: Config.getDefault()});
    assertStorageConfigHasRequiredAttrs(storageConfig);
  });

  it('storageConfig: wizNotePlus', () => {
    const storageConfig = StorageConfigWizNotePlus.get({config: Config.getDefault()});
    assertStorageConfigHasRequiredAttrs(storageConfig);
  });

  function assertStorageConfigHasRequiredAttrs(it) {
    H.assertTrue(it.hasOwnProperty('rootFolder'));
    H.assertTrue(it.hasOwnProperty('defaultCategory'));
    H.assertTrue(it.hasOwnProperty('mainFileFolder'));
    H.assertTrue(it.hasOwnProperty('mainFileName'));
    H.assertTrue(it.hasOwnProperty('saveInfoFile'));
    if (it.saveInfoFile) {
      H.assertTrue(it.hasOwnProperty('infoFileFolder'));
      H.assertTrue(it.hasOwnProperty('infoFileName'));
    }
    H.assertTrue(it.hasOwnProperty('saveTitleFile'));
    if (it.saveTitleFile) {
      H.assertTrue(it.hasOwnProperty('titleFileFolder'));
      H.assertTrue(it.hasOwnProperty('titleFileName'));
    }
    H.assertTrue(it.hasOwnProperty('assetFolder'));
    H.assertTrue(it.hasOwnProperty('assetFileName'));
    H.assertTrue(it.hasOwnProperty('frameFileFolder'));
    H.assertTrue(it.hasOwnProperty('frameFileName'));
  }


  it('should render Saving Folder variables', () => {
    const SavingFolderKeys = [
      'mainFileFolder',
      'infoFileFolder',
      'titleFileFolder',
      'frameFileFolder',
      'assetFolder'
    ];
    const timeVariables = ['$YYYY', '$YY', '$MM', '$DD', '$HH', '$mm', '$SS', '$TIME-INTSEC'];
    const pathVariables = ['$ROOT-FOLDER', '$CATEGORY-FOLDER', '$CLIPPING-FOLDER'];
    const variables = [...timeVariables, ...pathVariables, '$DOMAIN'];
    SavingFolderKeys.forEach((key) => {
      assetRenderSavingFolderVariables(key, variables);
    });
  });

  function assetRenderSavingFolderVariables(storageConfigKey, variables) {
    const params = getParams();
    variables.forEach((variable) => {
      params.storageConfig[storageConfigKey] = variable;
      const {storageInfo} = Render.exec(params);
      H.assertNotEqual(storageInfo[storageConfigKey], variable);
    });
  }

  it('should save title as filename', () => {
    const params = getParams();
    params.storageConfig.mainFileName = '$TITLE.$FORMAT';
    params.format = 'md'
    const {storageInfo} = Render.exec(params);
    H.assertEqual(storageInfo.mainFileName, 'A-awesome-title.md');
  });

  it('should generate title style clipping folder $YYYY-$MM-$DD-$TIME-INTSEC-$TITLE', () => {
    const params = getParams();
    params.storageConfig.clippingFolderName = '$YYYY-$MM-$DD-$TIME-INTSEC-$TITLE';
    const {storageInfo} = Render.exec(params);
    const clippingFolderName = storageInfo.mainFileFolder.split('/').pop();
    H.assertNotEqual(clippingFolderName.match(/\d{9,}-A-awesome-title/), null)
  });

  it('should generate title style clipping folder $TITLE', () => {
    const params = getParams();
    params.storageConfig.clippingFolderName = '$TITLE';
    const {storageInfo} = Render.exec(params);
    const clippingFolderName = storageInfo.mainFileFolder.split('/').pop();
    H.assertEqual(clippingFolderName, 'A-awesome-title');
  });

  it('should use domain as default category', () => {
    const params = getParams();
    params.storageConfig.defaultCategory = "$DOMAIN";
    params.storageConfig.mainFileFolder = "$CATEGORY-PATH";
    params.category = '';
    const {storageInfo} = Render.exec(params);
    H.assertEqual(storageInfo.category, params.domain);
    H.assertEqual(storageInfo.mainFileFolder, 'mx-wc/example.org');
  });

  it('should not set category when default category is $NONE', () => {
    const params = getParams();
    params.storageConfig.defaultCategory = "$NONE";
    params.storageConfig.mainFileFolder = "$CATEGORY-PATH";
    params.category = '';
    const {storageInfo} = Render.exec(params);
    H.assertEqual(storageInfo.category, '');
    H.assertEqual(storageInfo.mainFileFolder, 'mx-wc');
  });

  it('should use "default" as category when default category is ""', () => {
    const params = getParams();
    params.storageConfig.defaultCategory = "";
    params.storageConfig.mainFileFolder = "$CATEGORY-PATH";
    params.category = '';
    const {storageInfo} = Render.exec(params);
    H.assertEqual(storageInfo.category, 'default');
    H.assertEqual(storageInfo.mainFileFolder, 'mx-wc/default');
  })


  function clearPath(path) {
    return path.replace(/\d{4}-\d{2}-\d{2}-\d{8,}/, 'CLIPPING-FOLDER');
  }

  it('config.assetFolder: $CLIPPING-PATH/static', () => {
    const params = getParams();
    params.storageConfig.assetFolder = "$CLIPPING-PATH/static";
    const {storageInfo} = Render.exec(params);
    H.assertEqual(clearPath(storageInfo.assetFolder),
      'mx-wc/test/CLIPPING-FOLDER/static');
  });

  it('config.assetFolder: $CATEGORY-PATH/static', () => {
    const params = getParams();
    params.storageConfig.assetFolder = "$CATEGORY-PATH/static";
    const {storageInfo} = Render.exec(params);
    H.assertEqual(storageInfo.assetFolder,
      'mx-wc/test/static');
  });

  it('config.assetFolder: $STORAGE-PATH/static', () => {
    const params = getParams();
    params.storageConfig.assetFolder = "$STORAGE-PATH/static";
    const {storageInfo} = Render.exec(params);
    H.assertEqual(storageInfo.assetFolder, 'mx-wc/static');
  });

  it('config.assetFolder: empty string', () => {
    const params = getParams();
    params.storageConfig.assetFolder = "";
    const {storageInfo} = Render.exec(params);
    H.assertEqual(clearPath(storageInfo.assetFolder),
      'mx-wc/test/CLIPPING-FOLDER/assets');
  });


  function getParams() {
    const storageConfig = StorageConfigDefault.get({config: Config.getDefault()});
    return Object.assign({storageConfig}, getInputs(), {
      nameConflictResolver: T.createFilenameConflictResolver()
    });
  }

  function getInputs() {
    return {
      now: Date.now(),
      domain: 'example.org',
      format: 'html',
      title: 'A awesome title',
      category: 'test',
    };
  }
});

