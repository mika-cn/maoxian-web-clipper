
"use strict";

this.MxWcSave = (function (MxWcConfig, ExtApi) {

  // inputs => {:title, :category, :tags, :elem}
  function save(inputs) {
    const {title, category, tags, elem} = inputs;
    saveInputHistory('category', category);
    saveInputHistory('tags', tags);
    MxWcConfig.load().then((config) => {
      const appendTags = []
      if (config.saveDomainAsTag) {
        appendTags.push(window.location.host);
      }
      // default name
      let name = 'index';
      if (config.saveTitleAsFilename) {
        name = T.sanitizeFilename(title);
      }
      const fold = T.joinPath([category, T.generateFoldname()]);
      const filename = name + '.' + config.saveFormat;
      const info = {
        id         : fold.split('-').pop(),
        format     : config.saveFormat,
        title      : title,
        link       : window.location.href,
        category   : category,
        tags       : tags.concat(appendTags),
        created_at : T.currentTime().toString(),
        filename   : filename
      }

      LocalDisk.saveIndexFile(fold, info);

      if(!config.saveTitleAsFilename) {
        LocalDisk.saveTitleFile(fold, info);
      }

      saveClipHistory(fold, info);

      const params = {
        fold: fold,
        elem: elem,
        info: info,
        config: config
      }
      // 保存整个网页如何处理
      // 保存 iframe
      // Iframe 不需要 clipping info
      // Iframe 不能循环嵌套。
      // 裁剪过程中相同的资源不能下载多次。
      //

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
