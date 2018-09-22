
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
          category = (config.defaultCategory === '' ? 'default' : config.defaultCategory);
          fold = T.joinPath([ROOT, category, foldName]);
        }
      } else {
        if(category === '$NONE'){
          category = '';
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


      let parser = null;
      switch(config.saveFormat){
        case 'html' : parser = MxWcHtml; break;
        case 'md'   : parser = MxWcMarkdown; break;
      }

      addIndexFile(path, info);
      addTitleFile(config, path, info);

      const params = { path: path, elem: elem, info: info, config: config }
      parser.parse(params)
      saveClipHistory(path.clipFold, info);
    });
  }

  // private
  function addTitleFile(config, path, info){
    if(!(config.saveTitleAsFoldName || config.saveTitleAsFilename)) {
      TaskStore.save({
        clipId: info.clipId,
        type: 'text',
        mimeType: 'text/plain',
        filename: [path.clipFold,
          `a-title__${T.sanitizeFilename(info.title)}`
        ].join('/'),
        text: '-'
      })
    }
  }

  // private
  function addIndexFile(path, info){
    TaskStore.save({
      clipId: info.clipId,
      type: 'text',
      mimeType: 'application/json',
      filename: [path.clipFold, 'index.json'].join('/'),
      text: T.toJson(info)
    })
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
    const path = [clipFold, 'index.json'].join('/');
    const clip = Object.assign({path: path}, info);
    ExtApi.sendMessageToBackground({
      type: 'save.clip',
      body: {clip: clip}
    })
  }


  return {
    save: save
  }

})(MxWcConfig, ExtApi);
