
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/tool.js'),
      require('../lib/log.js'),
      require('../lib/ext-msg.js'),
      require('../lib/task.js'),
      require('./input-parser.js'),
      require('./save-as-html.js'),
      require('./save-as-markdown.js')
    );
  } else {
    // browser or other
    root.MxWcSave = factory(
      root.MxWcTool,
      root.MxWcLog,
      root.MxWcExtMsg,
      root.MxWcTask,
      root.MxWcInputParser,
      root.MxWcHtml,
      root.MxWcMarkdown
    );
  }
})(this, function(T, Log, ExtMsg, Task, InputParser,
    MxWcHtml, MxWcMarkdown, undefined) {
  "use strict";

  // inputs => {:format, :title, :category, :tagstr, :elem}
  function save(inputs, config) {
    let {format = config.saveFormat, title, category, tagstr, elem} = inputs;

    const inputParams = {
      format: format,
      title: title.trim(),
      category: category.trim(),
      tags: T.splitTagstr(tagstr),
      host: window.location.host,
      link: window.location.href,
      config: config
    }
    const {info, storageInfo, input,
      needSaveIndexFile, needSaveTitleFile
    } = InputParser.parse(inputParams);

    if(input.category != '') {
      saveInputHistory('category', input.category);
    }
    if(input.tags.length > 0) {
      saveInputHistory('tags', input.tags);
    }

    Log.debug(storageInfo)

    let parser = null;
    switch(info.format){
      case 'html' : parser = MxWcHtml; break;
      case 'md'   : parser = MxWcMarkdown; break;
    }

    const params = { storageInfo: storageInfo, elem: elem, info: info, config: config }
    parser.parse(params).then((tasks) => {
      if(needSaveTitleFile) {
        tasks.unshift(Task.createTitleTask(storageInfo.saveFolder, title, info.clipId));
      }
      if(needSaveIndexFile) {
        tasks.unshift(Task.createIndexTask(storageInfo.saveFolder, info))
      }

      const clipping = {
        info: info,
        tasks: Task.rmReduplicate(tasks)
      };

      Log.debug(clipping);

      // save clipping
      ExtMsg.sendToBackground({
        type: 'clipping.save',
        body: clipping
      });
    })
    saveClippingHistory(storageInfo.saveFolder, info);
  }

  //private
  function saveInputHistory(k, v){
    const body = {}
    body[k] = v;
    ExtMsg.sendToBackground({
      type: `save.${k}`,
      body: body
    });
  }

  //private
  function saveClippingHistory(saveFolder, info){
    const path = [saveFolder, 'index.json'].join('/');
    const clippingHistory = Object.assign({path: path}, info);
    ExtMsg.sendToBackground({
      type: 'save.clippingHistory',
      body: {clippingHistory: clippingHistory}
    })
  }


  return {
    save: save
  }
});
