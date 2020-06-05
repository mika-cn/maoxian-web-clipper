"use strict";

import T from '../lib/tool.js';
import VariableRender from '../lib/variable-render.js'
import Config from '../lib/config.js';

//==========================================
// Default Input Parser
//==========================================

function parse(params) {
  let {format, title, category: originalCategory, tags, domain, link, config} = params;

  // Set default title
  if(title === ""){ title = 'Untitled' }

  // Add domain as tag
  const appendTags = []
  if (config.saveDomainAsTag) {
    appendTags.push(domain);
  }

  // clipId
  const now = T.currentTime();
  const clipId = now.str.intSec;


  const storagePath = config.rootFolder;
  const category = dealCategory(config, originalCategory, now, domain);
  const categoryPath = dealCategoryPath(config, originalCategory, now, domain, storagePath);

  const filenameValueHash = {now, title, format, domain};
  // folder and path
  const clippingFolderName = VariableRender.exec(config.clippingFolderName,
    filenameValueHash, VariableRender.FilenameVariables);
  const clippingPath = T.joinPath(categoryPath, clippingFolderName);

  const pathValueHash = {storagePath, categoryPath, clippingPath};
  const pathVariables = ['$STORAGE-PATH', '$CATEGORY-PATH', '$CLIPPING-PATH'];


  const storageInfo = {};

  storageInfo.mainFileFolder = VariableRender.exec(
    fixPathVariable(config.mainFileFolder, 'mainFileFolder'),
    pathValueHash, pathVariables);
  storageInfo.mainFileName = VariableRender.exec(config.mainFileName,
    filenameValueHash, VariableRender.FilenameVariables);

  storageInfo.infoFileFolder = VariableRender.exec(
    fixPathVariable(config.infoFileFolder, 'infoFileFolder'),
    pathValueHash, pathVariables);
  storageInfo.infoFileName = VariableRender.exec(config.infoFileName,
    filenameValueHash, VariableRender.FilenameVariables);

  storageInfo.assetFolder = VariableRender.exec(
    fixPathVariable(config.assetFolder, 'assetFolder'),
    pathValueHash, pathVariables);

  storageInfo.assetRelativePath = T.calcPath(
    storageInfo.mainFileFolder, storageInfo.assetFolder
  );

  if (format === 'html') {
    storageInfo.frameFileFolder = VariableRender.exec(
      fixPathVariable(config.frameFileFolder, 'frameFileFolder'),
      pathValueHash, pathVariables);
  } else {
    // md
    storageInfo.frameFileFolder = storageInfo.mainFileFolder;
  }

  if (config.saveTitleFile) {
    storageInfo.titleFileFolder = VariableRender.exec(
      fixPathVariable(config.titleFileFolder, 'titleFileFolder'),
      pathValueHash, pathVariables);
    storageInfo.titleFileName = VariableRender.exec(config.titleFileName,
      filenameValueHash, VariableRender.FilenameVariables);
  }

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
    const startsWithVariable = [
      '$STORAGE-PATH',
      '$CATEGORY-PATH',
      '$CLIPPING-PATH'
    ].some((it) => {
      return value.startsWith(it);
    });
    if (startsWithVariable) {
      return value;
    } else {
      return ['$CLIPPING-PATH', value].join('/');
    }
  }
}


const InputParser_Default = {parse: parse};
export default InputParser_Default;
