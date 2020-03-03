
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
      domain: window.location.host.split(':')[0],
      link: window.location.href,
      config: config
    }
    const {info, storageInfo, input,
      needSaveIndexFile, needSaveTitleFile
    } = InputParser.parse(inputParams);

    // versions: none, 2.0
    info.version = '2.0'

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
        const filename = T.joinPath(storageInfo.titleFileFolder, storageInfo.titleFileName);
        tasks.unshift(Task.createTitleTask(filename, info.clipId));
      }
      const _tasks = Task.rmReduplicate(tasks);

      // info.paths is used to delete files.
      info.paths = [];
      if (needSaveIndexFile) {

        // calculate path
        info.paths.push(storageInfo.infoFileName);
        const {mainPath, paths} = Task.getRelativePath(
          _tasks, storageInfo.infoFileFolder);
        info.mainPath = mainPath;
        info.paths.push(...paths);

        const filename = T.joinPath(storageInfo.infoFileFolder, storageInfo.infoFileName);
        _tasks.unshift(Task.createInfoTask(filename, info))
      }

      const clipping = {
        info: info,
        tasks: Task.sort(_tasks)
      };

      Log.debug(clipping);

      // save clipping
      ExtMsg.sendToBackground({
        type: 'clipping.save',
        body: clipping
      });

      if (needSaveIndexFile)
        saveClippingHistory(info, storageInfo);
    })

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
  function saveClippingHistory(info, storageInfo){
    const path = T.joinPath(storageInfo.infoFileFolder, storageInfo.infoFileName);
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
