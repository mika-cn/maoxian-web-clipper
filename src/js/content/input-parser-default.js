  "use strict";

  import T from '../lib/tool.js';
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
    const {category, categoryPath} = dealCategoryAndCategoryPath(config, originalCategory, now, domain, storagePath);

    const filenameValueHash = {now, title, format, domain};
    // folder and path
    const clippingFolderName = Render.exec(config.clippingFolderName,
      filenameValueHash, Render.FilenameVariables);
    const clippingPath = T.joinPath(categoryPath, clippingFolderName);

    const pathValueHash = {storagePath, categoryPath, clippingPath};
    const pathVariables = ['$STORAGE-PATH', '$CATEGORY-PATH', '$CLIPPING-PATH'];


    const storageInfo = {};

    storageInfo.mainFileFolder = Render.exec(
      fixPathVariable(config.mainFileFolder, 'mainFileFolder'),
      pathValueHash, pathVariables);
    storageInfo.mainFileName = Render.exec(config.mainFileName,
      filenameValueHash, Render.FilenameVariables);

    storageInfo.infoFileFolder = Render.exec(
      fixPathVariable(config.infoFileFolder, 'infoFileFolder'),
      pathValueHash, pathVariables);
    storageInfo.infoFileName = Render.exec(config.infoFileName,
      filenameValueHash, Render.FilenameVariables);

    storageInfo.assetFolder = Render.exec(
      fixPathVariable(config.assetFolder, 'assetFolder'),
      pathValueHash, pathVariables);

    storageInfo.assetRelativePath = T.calcPath(
      storageInfo.mainFileFolder, storageInfo.assetFolder
    );

    if (format === 'html') {
      storageInfo.frameFileFolder = Render.exec(
        fixPathVariable(config.frameFileFolder, 'frameFileFolder'),
        pathValueHash, pathVariables);
    } else {
      // md
      storageInfo.frameFileFolder = storageInfo.mainFileFolder;
    }

    if (config.saveTitleFile) {
      storageInfo.titleFileFolder = Render.exec(
        fixPathVariable(config.titleFileFolder, 'titleFileFolder'),
        pathValueHash, pathVariables);
      storageInfo.titleFileName = Render.exec(config.titleFileName,
        filenameValueHash, Render.FilenameVariables);
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

  function dealCategoryAndCategoryPath(config, category, now, domain, storagePath) {
    let categoryPath;
    const v = {now: now, domain: domain};
    const defaultCategory = Render.exec(config.defaultCategory, v, Render.TimeVariables.concat(['$DOMAIN']));
    if (category === '') {
      if(defaultCategory === "$NONE"){
        categoryPath = storagePath;
      } else {
        category = (defaultCategory === '' ? 'default' : defaultCategory);
        categoryPath = T.joinPath(storagePath, category);
      }
    } else {
      if(category === '$NONE'){
        category = '';
        categoryPath = storagePath;
      } else {
        categoryPath = T.joinPath(storagePath, category);
      }
    }
    return {category, categoryPath};
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

  const Render = {}
  Render.TimeVariables = ['$TIME-INTSEC',
    '$YYYY', '$YY', '$MM', '$DD',
    '$HH', '$mm', '$SS'
  ];

  Render.FilenameVariables = Render.TimeVariables.concat([
    '$TITLE', '$FORMAT', '$DOMAIN']);


  Render['$TITLE'] = function(str, v) {
    return str.replace(/\$TITLE/mg, () => {
      return T.sanitizeFilename(v.title);
    });
  }

  Render.getTimeVariableRender = function(variable) {
    return function(str, v) {
      const name = variable.replace('$', '');
      const re = new RegExp(variable.replace('$', '\\$'), 'mg');
      return str.replace(re, () => {
        return v.now.str[name];
      })
    }
  }

  Render.getDefaultRender = function(variable) {
    return function(str, v) {
      const name = T.toJsVariableName(variable.replace('$', ''));
      const re = new RegExp(variable.replace('$', '\\$'), 'mg');
      return str.replace(re, () => {
        return v[name];
      });
    }
  }

  Render.exec = function(str, v, variables) {
    let s = str;
    variables.forEach((variable) => {
      let renderFn = Render[variable];
      if(!renderFn) {
        if (Render.TimeVariables.indexOf(variable) > -1) {
          renderFn = Render.getTimeVariableRender(variable);
        } else {
          renderFn = Render.getDefaultRender(variable);
        }
      }
      s = renderFn(s, v);
    });
    return s;
  }

  const InputParser_Default = {parse: parse, Render: Render};

  export default InputParser_Default;
