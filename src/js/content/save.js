
;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcSave', [
      'MxWcTool',
      'MxWcLog',
      'MxWcExtMsg',
      'MxWcInputParser',
      'MxWcHtml',
      'MxWcMarkdown',
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/tool.js'),
      require('../lib/log.js'),
      require('../lib/ext-msg.js'),
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
      root.MxWcInputParser,
      root.MxWcHtml,
      root.MxWcMarkdown
    );
  }
})(this, function(T, Log, ExtMsg, InputParser,
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
    const {info, path, input,
      needSaveIndexFile, needSaveTitleFile
    } = InputParser.parse(inputParams);

    if(input.category != '') {
      saveInputHistory('category', input.category);
    }
    if(input.tags.length > 0) {
      saveInputHistory('tags', input.tags);
    }

    Log.debug(path)

    let parser = null;
    switch(info.format){
      case 'html' : parser = MxWcHtml; break;
      case 'md'   : parser = MxWcMarkdown; break;
    }
  /*
  * Task:
  * saving task of resource (html, css, font, img, md...)
  *
  * structure:
  * {
  *   taskType : 'mainFileTask', 'imageFileTask' etc.
  *   type     : resource content type, 'url' or 'text'
  *   filename : filename to save
  *   url      : resource's url (if type is 'url')
  *   mimeType : resource's mimeType (if type is 'text')
  *   text     : resource's content (if type is 'text')
  *   headers  : http headers (Referer, UserAgent etc. if type is 'url')
  *   clipId   : clipping id
  *   createdMs: created time (millisecond)
  * }
  */

    const params = { path: path, elem: elem, info: info, config: config }
    parser.parse(params).then((tasks) => {
      if(needSaveTitleFile) {
        tasks.unshift(getTitleFileTask(path, info));
      }
      if(needSaveIndexFile) {
        tasks.unshift(getIndexFileTask(path, info));
      }

      const clipping = {
        info: info,
        tasks: rmReduplicateTask(tasks)
      };

      Log.debug(clipping);

      // save clipping
      ExtMsg.sendToBackground({
        type: 'clipping.save',
        body: clipping
      });
    })
    saveClippingHistory(path.saveFolder, info);
  }

  function rmReduplicateTask(tasks) {
    const result = [];
    const names = [];
    T.each(tasks, (task) => {
      if(names.indexOf(task.filename) === -1) {
        result.push(task);
        names.push(task.filename);
      } else {
        Log.debug('reduplicate task:', task);
      }
    });
    return result;
  }


  // private
  function getTitleFileTask(path, info){
    return {
      taskType: 'titleFileTask',
      type: 'text',
      filename: [path.saveFolder,
        `a-title__${T.sanitizeFilename(info.title)}`
      ].join('/'),
      mimeType: 'text/plain',
      text: '-',
      clipId: info.clipId,
      createdMs: T.currentTime().str.intMs
    }
  }

  // private
  function getIndexFileTask(path, info){
    return {
      taskType: 'InfoFileTask',
      type: 'text',
      filename: [path.saveFolder, 'index.json'].join('/'),
      mimeType: 'application/json',
      text: T.toJson(info),
      clipId: info.clipId,
      createdMs: T.currentTime().str.intMs
    }
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
