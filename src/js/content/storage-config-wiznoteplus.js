"use strict";

import T from '../lib/tool.js';

//==========================================
// Storage Config for WizNotePlus
//==========================================

function get(params) {
  const {config, now} = params;
  const currSec = now.str.intSec;

  const defaultConfig = T.sliceObj(config, ['rootFolder', 'defaultCategory']);

  const storageConfig = Object.assign(defaultConfig,
  // Keep all paths relative to $WIZNOTE_TEMP/webclipping
  {
    saveInfoFile: false,
    saveTitleFile: false,
    /** the path to place index.html or index.md */
    mainFileFolder: currSec,
    mainFilename = "index.$FORMAT",
    /** the path to place frame files */
    frameFileFolder: currSec + "/index_files",
    /** the path to place asset files */
    assetFolder: currSec + "/index_files",
  })
  return storageConfig;
}

const StorageConfig_Wiznoteplus = {get};
export default StorageConfig_Wiznoteplus;
