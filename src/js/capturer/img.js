;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/tool.js'),
      require('../lib/asset.js'),
      require('../lib/task.js'),
      require('./tool.js')
    );
  } else {
    // browser or other
    root.MxWcCapturerImg = factory(
      root.MxWcTool,
      root.MxWcAsset,
      root.MxWcTask,
      root.MxWcCaptureTool
    );
  }
})(this, function(T, Asset, Task, CaptureTool, undefined) {
  "use strict";

  /*!
   * Capture Element <img>
   */


  /**
   * @param {Object} opts
   *   - {String} baseUrl
   *   - {String} clipId
   *   - {Object} storageInfo
   *   - {Object} mimeTypeDict
   *
   */
  function capture(node, opts) {
    const {baseUrl, clipId, storageInfo, mimeTypeDict = {}} = opts;
    const tasks = [];

    node.removeAttribute('crossorigin');
    // referrerpolicy attribute

    // handle src
    const src = node.getAttribute('src');
    const {isValid, url, message} = T.completeUrl(src, baseUrl);
    if (isValid) {
      const {filename, url: assetPath} = Asset.calcInfo(url, storageInfo, mimeTypeDict[url], clipId);
      const task = Task.createImageTask(filename, url, clipId);
      node.setAttribute('src', assetPath);
      tasks.push(task);
    } else {
      // Do we need to change src attribute?
      node.setAttribute('data-mx-warn', message);
    }

    // handle srcset
    const srcsetTasks = CaptureTool.captureImageSrcset(node, opts);
    tasks.push(...srcsetTasks);

    return tasks;
  }

  return {capture: capture}
});
