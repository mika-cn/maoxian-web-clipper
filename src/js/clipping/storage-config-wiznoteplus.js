
//==========================================
// Storage Config for WizNotePlus
//==========================================

function get({config, now}) {
  const saveFolder = Math.floor(now/1000).toString();

  const defaultConfig = {
    rootFolder: config.rootFolder,
    defaultCategory: config.defaultCategory,
  }

  const storageConfig = Object.assign(defaultConfig,
  // Keep all paths relative to $WIZNOTE_TEMP/webclipping
  {
    saveInfoFile: false,
    saveTitleFile: false,
    /** the path to place index.html or index.md */
    mainFileFolder: saveFolder,
    mainFileName: "index.$FORMAT",
    /** the path to place frame files */
    frameFileFolder: saveFolder + "/index_files",
    /** the path to place asset files */
    assetFolder: saveFolder + "/index_files",
  })
  return storageConfig;
}

const StorageConfig_WizNotePlus = {get};
export default StorageConfig_WizNotePlus;
