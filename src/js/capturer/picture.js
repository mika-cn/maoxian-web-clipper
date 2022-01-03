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
 * @param {SnapshotNode} node
 * @param {Object} params
 * @param {String} params.baseUrl
 * @param {String} params.clipId
 * @param {Object} params.storageInfo
 * @param {Object} params.requestParams
 * @param {Object} params.config
 *
 * @returns {Object} result
 *
 */
async function capture(node, params) {
  const {config} = params;
  const tasks = [];
  const change = new SnapshotNodeChange();

  if (node.childNodes) {
    for (const childNode of node.childNodes) {
      if (childNode.name === 'SOURCE') {
        let r;
        if (config.htmlCaptureImage === 'saveCurrent') {
          const reason = "capture method: saveCurrent";
          r = CaptureTool.captureRemoveNode(reason);
        } else {
          // saveAll
          r = await CaptureTool.captureImageSrcset(childNode, params);
        }
        tasks.push(...r.tasks);
        childNode.change = r.change.toObject();
      }
      // <img> node will be handle by capturerImg.
    };
  }

  return {change, tasks};
}

export default {capture};
