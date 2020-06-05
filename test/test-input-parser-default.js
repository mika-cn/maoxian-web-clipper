
import H from './helper.js';
import T from '../src/js/lib/tool.js';
import Parser from '../src/js/content/input-parser-default.js';

describe('InputParserDefault', () => {
  function getParams() {
    return {
      format: 'html',
      title: 'A awesome title',
      category: 'test',
      tags: ['tagA', 'tagB'],
      domain: 'example.org',
      link: 'https://example.org/article/3.html',
      config: {
        saveDomainAsTag: false,
        rootFolder: 'mx-wc',
        assetFolder: '$CLIPPING-PATH/assets',

        defaultCategory: 'default',
        clippingFolderName: '$YYYY-$MM-$DD-$TIME-INTSEC',

        mainFileFolder: '$CLIPPING-PATH',
        mainFileName: 'index.$FORMAT',

        frameFileFolder: '$CLIPPING-PATH',

        saveTitleFile: true,
        titleFileFolder: '$CLIPPING-PATH',
        titleFileName: 'a-title_$TITLE',

        infoFileFolder: '$CLIPPING-PATH',
        infoFileName: 'index.json',
      }
    }
  }

  it('should save title as filename', () => {
    const params = getParams();
    params.config.mainFileName = '$TITLE.$FORMAT';
    const {storageInfo} = Parser.parse(params);
    H.assertEqual(storageInfo.mainFileName, 'A-awesome-title.html');
  });

  it('should generate title style clipping folder $YYYY-$MM-$DD-$TIME-INTSEC-$TITLE', () => {
    const params = getParams();
    params.config.clippingFolderName = '$YYYY-$MM-$DD-$TIME-INTSEC-$TITLE';
    const {storageInfo} = Parser.parse(params);
    const clippingFolderName = storageInfo.mainFileFolder.split('/').pop();
    H.assertNotEqual(clippingFolderName.match(/\d{9,}-A-awesome-title/), null)
  });

  it('should generate title style clipping folder $TITLE', () => {
    const params = getParams();
    params.config.clippingFolderName = '$TITLE';
    const {storageInfo} = Parser.parse(params);
    const clippingFolderName = storageInfo.mainFileFolder.split('/').pop();
    H.assertEqual(clippingFolderName, 'A-awesome-title');
  });

  it('should use domain as default category', () => {
    const params = getParams();
    params.config.defaultCategory = "$DOMAIN";
    params.category = '';
    const {info} = Parser.parse(params);
    H.assertEqual(info.category, params.domain);
  });

  it('should not set category when default category is $NONE', () => {
    const params = getParams();
    params.config.defaultCategory = "$NONE";
    params.category = '';
    const {info} = Parser.parse(params);
    H.assertEqual(info.category, '');
  });


  function clearPath(path) {
    return path.replace(/\d{4}-\d{2}-\d{2}-\d{8,}/, 'CLIPPING-FOLDER');
  }

  it('config.assetFolder: $CLIPPING-PATH/static', () => {
    const params = getParams();
    params.config.assetFolder = "$CLIPPING-PATH/static";
    const {storageInfo} = Parser.parse(params);
    H.assertEqual(clearPath(storageInfo.assetFolder),
      'mx-wc/test/CLIPPING-FOLDER/static');
    H.assertEqual(storageInfo.assetRelativePath, 'static');
  });

  it('config.assetFolder: $CATEGORY-PATH/static', () => {
    const params = getParams();
    params.config.assetFolder = "$CATEGORY-PATH/static";
    const {storageInfo} = Parser.parse(params);
    H.assertEqual(storageInfo.assetFolder,
      'mx-wc/test/static');
    H.assertEqual(storageInfo.assetRelativePath, '../static');
  });

  it('config.assetFolder: $STORAGE-PATH/static', () => {
    const params = getParams();
    params.config.assetFolder = "$STORAGE-PATH/static";
    const {storageInfo} = Parser.parse(params);
    H.assertEqual(storageInfo.assetFolder, 'mx-wc/static');
    H.assertEqual(storageInfo.assetRelativePath, '../../static');
  });

  it('config.assetFolder: empty string', () => {
    const params = getParams();
    params.config.assetFolder = "";
    const {storageInfo} = Parser.parse(params);
    H.assertEqual(clearPath(storageInfo.assetFolder),
      'mx-wc/test/CLIPPING-FOLDER/assets');
    H.assertEqual(storageInfo.assetRelativePath, 'assets');
  });

  it('config.assetFolder: static', () => {
    const params = getParams();
    params.config.assetFolder = "static";
    const {storageInfo} = Parser.parse(params);
    H.assertEqual(clearPath(storageInfo.assetFolder),
      'mx-wc/test/CLIPPING-FOLDER/static');
    H.assertEqual(storageInfo.assetRelativePath, 'static');
  });


});
