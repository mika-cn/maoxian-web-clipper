;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(require('./tool.js'));
  } else {
    // browser or other
    root.MxWcTask = factory(root.MxWcTool);
  }
})(this, function(T, undefined) {
  "use strict";
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

  function createHtmlTask(filename, html, clipId) {
    return createTextTask(filename, html, 'text/html', clipId, 'mainFileTask');
  }

  function createMarkdownTask(filename, markdown, clipId) {
    return createTextTask(filename, markdown, 'text/markdown', clipId, 'mainFileTask');
  }

  function createStyleTask(filename, style, clipId) {
    return createTextTask(filename, style, 'text/css', clipId, 'styleFileTask');
  }

  function createFrameTask(filename, html, clipId) {
    return createTextTask(filename, html, 'text/html', clipId, 'frameFileTask');
  }

  function createTitleTask(saveFolder, title, clipId) {
    const filename = [saveFolder, `a-title__${T.sanitizeFilename(title)}` ].join('/');
    return createTextTask(filename, '-', 'text/plain', clipId, 'titleFileTask');
  }

  function createIndexTask(saveFolder, info) {
    const filename = [saveFolder, 'index.json'].join('/');
    const text = T.toJson(info);
    return createTextTask(filename, text, 'application/json', info.clipId, 'infoFileTask');
  }

  function createImageTask(filename, url, clipId) {
    return createUrlTask(filename, url, clipId, 'imageFileTask');
  }

  function createUrlTask(filename, url, clipId, taskType = 'assetFileTask', headers={}) {
    return {
      taskType: taskType,
      type: 'url',
      filename: filename,
      url: url,
      headers: headers,
      clipId: clipId,
      createdMs: T.currentTime().str.intMs,
    }
  }

  // @private
  function createTextTask(filename, text, mimeType, clipId, taskType) {
    return {
      taskType: taskType,
      type: 'text',
      filename: filename,
      mimeType: mimeType,
      text: text,
      clipId: clipId,
      createdMs: T.currentTime().str.intMs,
    }
  }

  function rmReduplicate(tasks) {
    const result = [];
    const names = [];
    tasks.forEach((task) => {
      if (names.indexOf(task.filename) === -1) {
        result.push(task);
        names.push(task.filename);
      } else {
        console.debug('reduplicate task:', task);
      }
    });
    return result;
  }

  function appendHeaders(tasks, headers) {
    tasks.forEach((task) => {
      if (task.type === 'url') {
        task.headers = headers;
      }
    });
    return tasks;
  }

  return {
    createHtmlTask: createHtmlTask,
    createMarkdownTask: createMarkdownTask,
    createFrameTask: createFrameTask,
    createStyleTask: createStyleTask,
    createTitleTask: createTitleTask,
    createIndexTask: createIndexTask,
    createImageTask: createImageTask,
    createUrlTask: createUrlTask,
    rmReduplicate: rmReduplicate,
    appendHeaders: appendHeaders,
  }

});
