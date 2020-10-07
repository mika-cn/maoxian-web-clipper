"use strict";

import T      from '../lib/tool.js';
import Config from '../lib/config.js';

//==========================================
// Storage Config for Default
//==========================================

function get(params) {
  const {config} = params;
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

/*

function parse(params) {
  let {format, title, category: originalCategory, tags, domain, link, config} = params;

  // clipId
  const now = T.currentTime();
  const clipId = now.str.intSec;

  //
  const storageInfo = {};

  //console.debug(storageInfo);

  const info = {
    clipId     : clipId,
    format     : format,
    title      : title,
    link       : link,
    category   : category,
    tags       : tags.concat(appendTags),
    created_at : now.toString(),
  }

  const inputHistory = { title: title, category: category, tags: tags }

  const result = {
    info: info,
    storageInfo: storageInfo,
    input: inputHistory,
    needSaveIndexFile: true,
    needSaveTitleFile: config.saveTitleFile
  }

  return result;
}

*/

const StorageConfig_Default = {get};
export default StorageConfig_Default;
