"use strict";

import T      from '../lib/tool.js';
import Config from '../lib/config.js';

//==========================================
// Storage Config for Default
//==========================================

function get({config}) {
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
  return storageConfig;
}

const StorageConfig_Default = {get};
export default StorageConfig_Default;
