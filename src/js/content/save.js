
"use strict";

this.MxWcSave = (function (MxWcConfig, ExtApi) {

  // v => {:title, :category, :tags}
  function save(v) {
    saveHistory('category', v.category);
    saveHistory('tags', v.tags);
    MxWcConfig.load().then((config) => {
      const appendTags = []
      if (config.saveHostAsTag) {
        appendTags.push(window.location.host);
      }
      let name = 'index';
      if (config.saveTitleAsFilename) {
        name = T.sanitizeFilename(v.title);
      }
      const fold = T.joinPath([v.category, T.generateFoldname()]);
      const filename = name + '.' + config.saveFormat;
      const info = {
        id: fold.split('-').pop(),
        format: config.saveFormat,
        title: v.title,
        link: window.location.href,
        category: v.category,
        tags: v.tags.concat(appendTags),
        created_at: T.currentTime().toString(),
        filename: filename
      }

      LocalDisk.saveIndexFile(fold, info);

      if(!config.saveTitleAsFilename) {
        LocalDisk.saveTitleFile(fold, info);
      }

      saveClipHistory(fold, info);

      switch(config.saveFormat){
        case 'html': saveAsHtml(fold, v.elem, info); break;
        case 'md': saveAsMd(fold, v.elem, info); break;
      }
    });
  }

  function saveHistory(k, v){
    const body = {}
    body[k] = v;
    ExtApi.sendMessageToBackground({
      type: `save.${k}`,
      body: body
    });
  }

  function saveClipHistory(fold, info){
    info.path = `mx-wc${fold}/index.json`;
    ExtApi.sendMessageToBackground({
      type: 'save.clip',
      body: {clip: info}
    })
  }


  return {
    save: save
  }

})(MxWcConfig, ExtApi);
