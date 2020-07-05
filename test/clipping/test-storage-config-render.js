
import H from '../helper.js';
import T from '../../src/js/lib/tool.js';
import Config from '../../src/js/lib/config.js';
import Render from '../../src/js/clipping/storage-config-render.js';

describe("StorageConfigRender", () => {

  it('should save title as filename', () => {
    const params = getParams();
    params.storageConfig.mainFileName = '$TITLE.$FORMAT';
    params.format = 'md'
    const {mainFileName} = Render.exec(params);
    H.assertEqual(mainFileName, 'A-awesome-title.md');
  });

  it('should generate title style clipping folder $YYYY-$MM-$DD-$TIME-INTSEC-$TITLE', () => {
    const params = getParams();
    params.storageConfig.clippingFolderName = '$YYYY-$MM-$DD-$TIME-INTSEC-$TITLE';
    const {mainFileFolder} = Render.exec(params);
    const clippingFolderName = mainFileFolder.split('/').pop();
    H.assertNotEqual(clippingFolderName.match(/\d{9,}-A-awesome-title/), null)
  });

  it('should generate title style clipping folder $TITLE', () => {
    const params = getParams();
    params.storageConfig.clippingFolderName = '$TITLE';
    const {mainFileFolder} = Render.exec(params);
    const clippingFolderName = mainFileFolder.split('/').pop();
    H.assertEqual(clippingFolderName, 'A-awesome-title');
  });

  it('should use domain as default category', () => {
    const params = getParams();
    params.storageConfig.defaultCategory = "$DOMAIN";
    params.category = '';
    const {category} = Render.exec(params);
    H.assertEqual(category, params.domain);
  });

  it('should not set category when default category is $NONE', () => {
    const params = getParams();
    params.storageConfig.defaultCategory = "$NONE";
    params.category = '';
    const {category} = Render.exec(params);
    H.assertEqual(category, '');
  });


  function clearPath(path) {
    return path.replace(/\d{4}-\d{2}-\d{2}-\d{8,}/, 'CLIPPING-FOLDER');
  }

  it('config.assetFolder: $CLIPPING-PATH/static', () => {
    const params = getParams();
    params.storageConfig.assetFolder = "$CLIPPING-PATH/static";
    const {assetFolder, assetRelativePath} = Render.exec(params);
    H.assertEqual(clearPath(assetFolder),
      'mx-wc/test/CLIPPING-FOLDER/static');
    H.assertEqual(assetRelativePath, 'static');
  });

  it('config.assetFolder: $CATEGORY-PATH/static', () => {
    const params = getParams();
    params.storageConfig.assetFolder = "$CATEGORY-PATH/static";
    const {assetFolder, assetRelativePath} = Render.exec(params);
    H.assertEqual(assetFolder,
      'mx-wc/test/static');
    H.assertEqual(assetRelativePath, '../static');
  });

  it('config.assetFolder: $STORAGE-PATH/static', () => {
    const params = getParams();
    params.storageConfig.assetFolder = "$STORAGE-PATH/static";
    const {assetFolder, assetRelativePath} = Render.exec(params);
    H.assertEqual(assetFolder, 'mx-wc/static');
    H.assertEqual(assetRelativePath, '../../static');
  });

  it('config.assetFolder: empty string', () => {
    const params = getParams();
    params.storageConfig.assetFolder = "";
    const {assetFolder, assetRelativePath} = Render.exec(params);
    H.assertEqual(clearPath(assetFolder),
      'mx-wc/test/CLIPPING-FOLDER/assets');
    H.assertEqual(assetRelativePath, 'assets');
  });

  it('3rd handler', () => {
    const inputs = getInputs();
    const saveFolder = Math.floor(inputs.now/1000).toString();

    const storageConfig = {
      rootFolder: 'mx-wc',
      defaultCategory: 'default',
      saveInfoFile: false,
      saveTitleFile: false,
      mainFileFolder: saveFolder,
      mainFileName: "index.$FORMAT",
      frameFileFolder: saveFolder + "/index_files",
      assetFolder: saveFolder + "/index_files",
    }
    const params = Object.assign(inputs, {storageConfig});
    const {assetFolder, assetRelativePath} = Render.exec(params);
    H.assertEqual(assetFolder, saveFolder + "/index_files");
    H.assertEqual(assetRelativePath, 'index_files');
  });


  function getParams() {
    const config = Config.getDefault();
    const storageConfig = T.sliceObj(config, [
      'rootFolder',
      'defaultCategory',
      'clippingFolderName',
      'mainFileFolder',
      'mainFileName',
      'saveInfoFile',
      'infoFileFolder',
      'infoFileName',
      'assetFolder',
      'frameFileFolder',
      'saveTitleFile',
      'titleFileFolder',
      'titleFileName',
    ]);

    return Object.assign({storageConfig}, getInputs());
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

