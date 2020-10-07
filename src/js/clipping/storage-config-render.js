
import T              from '../lib/tool.js';
import Config         from '../lib/config.js';
import VariableRender from '../lib/variable-render.js'

/*
 * Render storage config
 * @params {Object} params
 *   - {Object} storageConfig
 *   - {Integer} now - Date.now()
 *   - {String} domain
 *   - {String} format
 *   - {String} title
 *   - {String} category
 *
 * @return storageInfo
 */
function exec({storageConfig: config, now, domain,
  format, title, category: originalCategory}) {

  const filenameValueHash = {now, title, format, domain};

  // folder and path
  const storagePath = config.rootFolder;
  const category = dealCategory(config, originalCategory, now, domain);
  const categoryPath = dealCategoryPath(config, originalCategory, now, domain, storagePath);

  let pathValueHash = {storagePath, categoryPath};
  let pathVariables = ['$STORAGE-PATH', '$CATEGORY-PATH'];

  let clippingPath = "clippingFolderName-not-specified";
  if (config.clippingFolderName) {
    const clippingFolderName = VariableRender.exec(config.clippingFolderName,
      filenameValueHash, VariableRender.FilenameVariables);
    clippingPath = T.joinPath(categoryPath, clippingFolderName);

    pathValueHash['clippingPath'] = clippingPath;
    pathVariables.push('$CLIPPING-PATH');
  } else {
    // 3rd party don't need clippingPath
  }

  // FIXME category should be here?
  const storageInfo = {category: category};

  // Main file
  storageInfo.mainFileFolder = VariableRender.exec(
    fixPathVariable(config.mainFileFolder, 'mainFileFolder'),
    pathValueHash, pathVariables);
  storageInfo.mainFileName = VariableRender.exec(config.mainFileName,
    filenameValueHash, VariableRender.FilenameVariables);

  // Info file
  if (config.saveInfoFile) {
    storageInfo.infoFileFolder = VariableRender.exec(
      fixPathVariable(config.infoFileFolder, 'infoFileFolder'),
      pathValueHash, pathVariables);
    storageInfo.infoFileName = VariableRender.exec(config.infoFileName,
      filenameValueHash, VariableRender.FilenameVariables);
  }

  // asset file
  storageInfo.assetFolder = VariableRender.exec(
    fixPathVariable(config.assetFolder, 'assetFolder'),
    pathValueHash, pathVariables);
  storageInfo.assetRelativePath = T.calcPath(
    storageInfo.mainFileFolder, storageInfo.assetFolder
  );

  // frame file
  if (format === 'html') {
    storageInfo.frameFileFolder = VariableRender.exec(
      fixPathVariable(config.frameFileFolder, 'frameFileFolder'),
      pathValueHash, pathVariables);
  } else {
    // md
    storageInfo.frameFileFolder = storageInfo.mainFileFolder;
  }

  // title file
  if (config.saveTitleFile) {
    storageInfo.titleFileFolder = VariableRender.exec(
      fixPathVariable(config.titleFileFolder, 'titleFileFolder'),
      pathValueHash, pathVariables);
    storageInfo.titleFileName = VariableRender.exec(config.titleFileName,
      filenameValueHash, VariableRender.FilenameVariables);
  }

  return storageInfo;
}

function dealCategory(config, category, now, domain) {
  const v = {now: now, domain: domain};
  const defaultCategory = VariableRender.exec(config.defaultCategory, v, VariableRender.TimeVariables.concat(['$DOMAIN']));
  if (category === '') {
    if (defaultCategory === '$NONE') {
      // Do nothing
    } else {
      category = (defaultCategory === '' ? 'default' : defaultCategory);
    }
  } else {
    if (category === '$NONE') {
      category = '';
    } else {
      // Do nothing
    }
  }
  return category;
}

function dealCategoryPath(config, category, now, domain, storagePath) {
  let categoryPath;
  const v = {now: now, domain: domain};
  const defaultCategory = VariableRender.exec(config.defaultCategory, v, VariableRender.TimeVariables.concat(['$DOMAIN']));
  if (category === '') {
    if(defaultCategory === "$NONE"){
      categoryPath = storagePath;
    } else {
      categoryPath = T.joinPath(storagePath, category);
    }
  } else {
    if(category === '$NONE'){
      categoryPath = storagePath;
    } else {
      categoryPath = T.joinPath(storagePath, category);
    }
  }
  return categoryPath
}

function fixPathVariable(value, key) {
  const DefaultConfig = Config.getDefault();
  if (value === '') {
    // user didn't specify any path, then we use default
    return DefaultConfig[key];
  } else {
    return value;
  }
}

const StorageConfigRender = {exec};
export default StorageConfigRender;
