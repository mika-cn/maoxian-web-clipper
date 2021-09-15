"use strict";

import T           from '../lib/tool.js';
import CaptureTool from './tool.js';
import SnapshotNodeChange from '../snapshot/change.js';

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
 * @param {Object} params
 *   - {String} baseUrl
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {Object} requestParams
 *
 */
async function capture(node, params) {
  const tasks = [];
  const change = new SnapshotNodeChange();

  if (node.childNodes) {
    for (const childNode of node.childNodes) {
      if (childNode.name === 'SOURCE') {
        const r = await CaptureTool.captureImageSrcset(childNode, params);
        tasks.push(...r.tasks);
        childNode.change = r.change.toObject();
      }
    };
  }

  return {change, tasks};
}

export default {capture};
