
//==========================================
// Default Input Parser
//==========================================

(function(global) {

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
    if(config.assetPath.indexOf('$CLIP-FOLD') > -1){
      assetRelativePath = config.assetPath.replace('$CLIP-FOLD/', '');
      assetFolder = T.joinPath([saveFolder, assetRelativePath]);
    } else {
      if(config.assetPath.indexOf('$MX-WC') > -1){
        assetFolder = T.joinPath([ROOT, config.assetPath.replace('$MX-WC/', '')]);
        assetRelativePath = T.calcPath(saveFolder, assetFolder)
      } else {
        assetRelativePath = (config.assetPath === '' ? 'assets' : config.assetPath);
        assetFolder = T.joinPath([saveFolder, assetRelativePath]);
      }
    }
    return [assetFolder, assetRelativePath];
  }

  function dealCategoryAndSaveFolder(config, category, clippingFolder) {
    const ROOT = 'mx-wc';
    let folder = null;
    if(category === ""){
      if(config.defaultCategory === "$NONE"){
        folder = T.joinPath([ROOT, clippingFolder])
      } else {
        category = (config.defaultCategory === '' ? 'default' : config.defaultCategory);
        folder = T.joinPath([ROOT, category, clippingFolder]);
      }
    } else {
      if(category === '$NONE'){
        category = '';
        folder = T.joinPath([ROOT, clippingFolder])
      } else {
        folder = T.joinPath([ROOT, category, clippingFolder]);
      }
    }
    return [category, folder]
  }

  function getClippingFolder(config, title, now) {
    const defaultName = generateDefaultClippingFolderName(config, now)
    let name = defaultName;
    if (config.saveTitleAsFoldName) {
      switch(config.titleClippingFolderFormat){
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
    return !(config.saveTitleAsFoldName || config.saveTitleAsFilename)
  }


  const publicApi = {parse: parse};

  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = publicApi;
  } else {
    // browser or other
    global.InputParser_Default = publicApi;
  }
  return

})(this);
