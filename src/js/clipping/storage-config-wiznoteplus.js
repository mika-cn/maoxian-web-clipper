
//==========================================
// Storage Config for WizNotePlus
//==========================================

function get(params) {
  const {config, now} = params;
  const currSec = Math.floor(now/1000);

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
    mainFileFolder: currSec.toString(),
    mainFileName: "index.$FORMAT",
    /** the path to place frame files */
    frameFileFolder: currSec + "/index_files",
    /** the path to place asset files */
    assetFolder: currSec + "/index_files",
  })
  return storageConfig;
}

const StorageConfig_WizNotePlus = {get};
export default StorageConfig_WizNotePlus;
