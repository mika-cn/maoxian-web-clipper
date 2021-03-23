
//==========================================
// Storage Config for WizNotePlus
//==========================================

function get({config}) {
  const saveFolder = "$TIME-INTSEC";

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
    frameFileName: '$TIME-INTSEC-$MD5URL.frame.html',
    /** the path to place asset files */
    assetFolder: saveFolder + "/index_files",
    assetFileName: "$TIME-INTSEC-$MD5URL$EXT",
  })
  return storageConfig;
}

const StorageConfig_WizNotePlus = {get};
export default StorageConfig_WizNotePlus;
