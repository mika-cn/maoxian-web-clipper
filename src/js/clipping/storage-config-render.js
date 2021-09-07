
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
 *   - {FilenameConflictResolver} nameConflictResolver
 *
 * @return storageInfo
 */
function exec({storageConfig: config, now, domain,
  format, title, category: originalCategory, nameConflictResolver}) {

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

  // storageInfo.raw stores storageConfig Items that can't be decided now.
  storageInfo.raw = {};
  // storageInfo.valueObj stores values that will be used to asset/iframe filename rendering.
  storageInfo.valueObj = {now};

  // ====================================
  // render folder
  // ====================================
  storageInfo.mainFileFolder = VariableRender.exec(
    fixPathVariable(config.mainFileFolder, 'mainFileFolder'),
    pathValueHash, pathVariables);
  nameConflictResolver.addFolder(storageInfo.mainFileFolder);

  storageInfo.assetFolder= VariableRender.exec(
    fixPathVariable(config.assetFolder, 'assetFolder'),
    pathValueHash, pathVariables);
  nameConflictResolver.addFolder(storageInfo.assetFolder);

  if (config.saveInfoFile) {
    storageInfo.infoFileFolder = VariableRender.exec(
      fixPathVariable(config.infoFileFolder, 'infoFileFolder'),
      pathValueHash, pathVariables);
    nameConflictResolver.addFolder(storageInfo.infoFileFolder);
  }

  if (config.saveTitleFile) {
    storageInfo.titleFileFolder= VariableRender.exec(
      fixPathVariable(config.titleFileFolder, 'titleFileFolder'),
      pathValueHash, pathVariables);
    nameConflictResolver.addFolder(storageInfo.titleFileFolder);
  }

  if (format === 'html') {
    storageInfo.frameFileFolder = VariableRender.exec(
      fixPathVariable(config.frameFileFolder, 'frameFileFolder'),
      pathValueHash, pathVariables);
    nameConflictResolver.addFolder(storageInfo.frameFileFolder);
  } else {
    // md don't need to store frame files
  }


  // ====================================
  // render filename and relative path
  // ====================================

  const mainFileName = VariableRender.exec(config.mainFileName,
    filenameValueHash, VariableRender.FilenameVariables);
  storageInfo.mainFileName = nameConflictResolver.resolveFile('__mainFileName__', storageInfo.mainFileFolder, mainFileName);

  storageInfo.assetRelativePath = T.calcPath(
    storageInfo.mainFileFolder, storageInfo.assetFolder
  );
  storageInfo.raw.assetFileName = config.assetFileName;

  if (config.saveInfoFile) {
    const infoFileName = VariableRender.exec(config.infoFileName,
      filenameValueHash, VariableRender.FilenameVariables);

    storageInfo.infoFileName = nameConflictResolver.resolveFile('__infoFileName__', storageInfo.infoFileFolder, infoFileName);
  }

  if (config.saveTitleFile) {
    const titleFileName = VariableRender.exec(config.titleFileName,
      filenameValueHash, VariableRender.FilenameVariables);
    storageInfo.titleFileName = nameConflictResolver.resolveFile('__titleFileName__', storageInfo.titleFileFolder, titleFileName);
  }

  if (format === 'html') {
    storageInfo.raw.frameFileName = config.frameFileName;
  }

  return {storageInfo, nameConflictResolver};
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
