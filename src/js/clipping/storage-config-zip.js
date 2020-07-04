"use strict";

import sanitize from 'sanitize-filename';

//==========================================
// Storage Config for for Zip
//==========================================

const StorageConfig_Zip = {
  get: params => {
    const { config, userInput} = params;
  
    const defaultConfig = {
      rootFolder: config.rootFolder,
      defaultCategory: config.defaultCategory,
    }
  
    const sanitized_title = sanitize(userInput.title);
    const storageConfig = Object.assign(defaultConfig, {
      /** the path to place index.html and assetFolder */
      mainFileFolder: sanitized_title,
      mainFileName: "index.$FORMAT",
      /** the path to place frame files */
      frameFileFolder: sanitized_title + "/index_files",
      /** the path to place asset files */
      assetFolder: sanitized_title + "/index_files",
      /** the path is relative to index.html */
      assetRelativePath: "index_files"
    });

    return storageConfig;
  }
};

export default StorageConfig_Zip;
