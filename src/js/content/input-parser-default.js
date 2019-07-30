
//==========================================
// Default Input Parser
//==========================================

const T = require('../tool.js');

function parse(params) {
  let {format, title, category: originalCategory, tags, host, link, config} = params;

  if(title === ""){ title = 'default' }

  const appendTags = []
  if (config.saveDomainAsTag) {
    appendTags.push(host);
  }

  // main filename
  const mainFileArr = ['index', format];
  if (config.saveTitleAsFilename) {
    mainFileArr[0] = T.sanitizeFilename(title);
  }
  const mainFilename = mainFileArr.join('.');

  // clipId
  const now = T.currentTime();
  const clipId = now.str.intSec;

  // folder and path
  const clippingFolder = getClippingFolder(config, title, now);
  const [category, saveFolder] = dealCategoryAndSaveFolder(config, originalCategory, clippingFolder);
  const [assetFolder, assetRelativePath] = dealAssetFolderAndPath(config, saveFolder);

  const path =  { saveFolder: saveFolder, assetFolder: assetFolder, assetRelativePath: assetRelativePath};
  //Log.debug(path)

  const info = {
    clipId     : clipId,
    format     : format,
    title      : title,
    link       : link,
    category   : category,
    tags       : tags.concat(appendTags),
    created_at : now.toString(),
    filename   : mainFilename
  }

  const inputHistory = { title: title, category: category, tags: tags }

  const result = {
    info: info,
    path: path,
    input: inputHistory,
    needSaveIndexFile: true,
    needSaveTitleFile: needSaveTitleFile(config)
  }

  return result;
}

function dealAssetFolderAndPath(config, saveFolder) {
  let assetFolder = null;
  let assetRelativePath = null;
  if(config.assetPath.indexOf('$CLIPPING-PATH') > -1){
    assetRelativePath = config.assetPath.replace('$CLIPPING-PATH/', '');
    assetFolder = T.joinPath([saveFolder, assetRelativePath]);
  } else {
    if(config.assetPath.indexOf('$STORAGE-PATH') > -1){
      assetFolder = T.joinPath([config.rootFolder, config.assetPath.replace('$STORAGE-PATH/', '')]);
      assetRelativePath = T.calcPath(saveFolder, assetFolder)
    } else {
      assetRelativePath = (config.assetPath === '' ? 'assets' : config.assetPath);
      assetFolder = T.joinPath([saveFolder, assetRelativePath]);
    }
  }
  return [assetFolder, assetRelativePath];
}

function dealCategoryAndSaveFolder(config, category, clippingFolder) {
  let folder = null;
  if(category === ""){
    if(config.defaultCategory === "$NONE"){
      folder = T.joinPath([config.rootFolder, clippingFolder])
    } else {
      category = (config.defaultCategory === '' ? 'default' : config.defaultCategory);
      folder = T.joinPath([config.rootFolder, category, clippingFolder]);
    }
  } else {
    if(category === '$NONE'){
      category = '';
      folder = T.joinPath([config.rootFolder, clippingFolder])
    } else {
      folder = T.joinPath([config.rootFolder, category, clippingFolder]);
    }
  }
  return [category, folder]
}

function getClippingFolder(config, title, now) {
  const defaultName = generateDefaultClippingFolderName(config, now)
  let name = defaultName;
  if (config.titleStyleClippingFolderEnabled) {
    switch(config.titleStyleClippingFolderFormat){
      case '$FORMAT-B':
        name = T.sanitizeFilename(title);
        break;
      default:
        // $FORMAT-A or other
        name = [defaultName, T.sanitizeFilename(title)].join('-');
    }
  }
  return name;
}

function generateDefaultClippingFolderName(config, now) {
  const s = now.str;
  let name = '';
  switch(config.defaultClippingFolderFormat) {
    case '$FORMAT-B':
      name = [
        s.year, s.month, s.day,
        s.hour, s.minute, s.second
      ].join('')
      break;
    case '$FORMAT-C':
      name = s.intSec;
      break;
    default:
      // $FORMAT-A or other
      name = [
        s.year, s.month, s.day,
        s.intSec
      ].join('-');
  }
  return name;
}

function needSaveTitleFile(config) {
  return !(config.titleStyleClippingFolderEnabled || config.saveTitleAsFilename)
}

module.exports = {parse: parse};
