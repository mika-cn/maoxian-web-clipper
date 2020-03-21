  "use strict";

  import T from '../lib/tool.js';
  import CaptureTool from './tool.js';

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
      const {tasks: sourceTasks} = CaptureTool.captureImageSrcset(sourceNode, opts);
      tasks.push(...sourceTasks);
    });
    return {node, tasks};
  }


  const CapturerPicture = {capture: capture}

  export default CapturerPicture;