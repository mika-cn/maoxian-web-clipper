"use strict";

import T           from '../lib/tool.js';
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
 *   - {Object} requestParams
 *
 */
async function capture(node, opts) {
  const tasks = [];

  const sourceNodes = node.querySelectorAll('source');
  for (let i = 0; i < sourceNodes.length; i++) {
    const {tasks: sourceTasks} = await CaptureTool.captureImageSrcset(sourceNodes[i], opts);
    tasks.push(...sourceTasks);
  }
  return {node, tasks};
}

export default {capture};
