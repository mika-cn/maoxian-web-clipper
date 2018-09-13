
"use strict";

this.MxWcSave = (function (MxWcConfig, ExtApi) {

  // inputs => {:title, :category, :tagstr, :elem}
  function save(inputs) {
    let {title, category, tagstr, elem} = inputs;
    MxWcConfig.load().then((config) => {
      if(title.trim() === ""){
        title = 'default';
      }

      const tags = T.splitTagstr(tagstr);
      saveInputHistory('tags', tags);
      const appendTags = []
      if (config.saveDomainAsTag) {
        appendTags.push(window.location.host);
      }

      // deal filename
      let name = 'index';
      if (config.saveTitleAsFilename) {
        name = T.sanitizeFilename(title);
      }
      const filename = name + '.' + config.saveFormat;

      // deal Fold
      const ROOT = 'mx-wc';
      let fold = null;
      let foldName = T.generateFoldname();
      const clipId = foldName.split('-').pop();
      if (config.saveTitleAsFoldName) {
        foldName = [clipId, T.sanitizeFilename(title)].join('-');
      }
      category = category.trim();
      if(category === ""){
        if(config.defaultCategory === "$NONE"){
          fold = T.joinPath([ROOT, foldName])
        } else {
          if(config.defaultCategory === ""){
            fold = T.joinPath([ROOT, 'default', foldName]);
          } else {
            fold = T.joinPath([ROOT, config.defaultCategory, foldName]);
          }
        }
      } else {
        if(category === '$NONE'){
          fold = T.joinPath([ROOT, foldName])
        } else {
          saveInputHistory('category', category);
          fold = T.joinPath([ROOT, category, foldName]);
        }
      }

      // asset fold
      let assetFold = null;
      let assetRelativePath = null;
      if(config.assetPath.indexOf('$CLIP-FOLD') > -1){
        assetRelativePath = config.assetPath.replace('$CLIP-FOLD/', '');
        assetFold = T.joinPath([fold, assetRelativePath]);
      } else {
        if(config.assetPath.indexOf('$MX-WC') > -1){
          assetFold = T.joinPath([ROOT, config.assetPath.replace('$MX-WC/', '')]);
          assetRelativePath = T.calcPath(fold, assetFold)
        } else {
          assetRelativePath = (config.assetPath === '' ? 'assets' : config.assetPath);
          assetFold = T.joinPath([fold, assetRelativePath]);
        }
      }

      const path =  { clipFold: fold, assetFold: assetFold, assetRelativePath: assetRelativePath};
      Log.debug(path)

      const info = {
        clipId     : clipId,
        format     : config.saveFormat,
        title      : title,
        link       : window.location.href,
        category   : category,
        tags       : tags.concat(appendTags),
        created_at : T.currentTime().toString(),
        filename   : filename
      }

      LocalDisk.saveIndexFile(path.clipFold, info);

      if(!(config.saveTitleAsFoldName || config.saveTitleAsFilename)) {
        LocalDisk.saveTitleFile(path.clipFold, info);
      }

      saveClipHistory(path.clipFold, info);

      const params = { path: path, elem: elem, info: info, config: config }

      switch(config.saveFormat){
        case 'html' : MxWcHtml.save(params); break;
        case 'md'   : MxWcMarkdown.save(params); break;
      }
    });
  }

  //private
  function saveInputHistory(k, v){
    const body = {}
    body[k] = v;
    ExtApi.sendMessageToBackground({
      type: `save.${k}`,
      body: body
    });
  }

  //private
  function saveClipHistory(clipFold, info){
    info.path = [clipFold, 'index.json'].join('/');
    ExtApi.sendMessageToBackground({
      type: 'save.clip',
      body: {clip: info}
    })
  }


  return {
    save: save
  }

})(MxWcConfig, ExtApi);
