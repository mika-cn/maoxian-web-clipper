;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/tool.js'),
      require('./tool.js')
    );
  } else {
    // browser or other
    root.MxWcCapturerPicture = factory(
      root.MxWcTool,
      root.MxWcCaptureTool
    );
  }
})(this, function(T, CaptureTool, undefined) {
  "use strict";

  /*!
   * Capture Element Picture
   *
   *
   * Attributes of Source Element we care about.
   *   - srcset
   *   - type : mimeType
   */

  /**
   *
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

    const sourceNodes = node.querySelectorAll('source');
    [].forEach.call(sourceNodes, (sourceNode) => {
      const sourceTasks = CaptureTool.captureImageSrcset(sourceNode, opts);
      tasks.push(...sourceTasks);
    });
    return tasks;
  }


  return {capture: capture}
});
