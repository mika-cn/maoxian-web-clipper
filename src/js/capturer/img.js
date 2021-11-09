"use strict";

import T           from '../lib/tool.js';
import Asset       from '../lib/asset.js';
import Task        from '../lib/task.js';
import CaptureTool from './tool.js';
import SnapshotNodeChange from '../snapshot/change.js';

const ATTR_PARAMS_IMG = {resourceType: 'Image', attrName: 'src'}

/**
 *
 * @param {Object} params
 *   - {String} saveFormat
 *   - {String} baseUrl
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {Object} requestParams
 *
 */
async function capture(node, params) {
  const {saveFormat, baseUrl, clipId, storageInfo, requestParams} = params;
  const tasks = [];
  let change = new SnapshotNodeChange();

  change.rmAttr('crossorigin');
  // referrerpolicy attribute

  const r = await CaptureTool.captureAttrResource(node, params, ATTR_PARAMS_IMG);
  tasks.push(...r.tasks);
  change = change.merge(r.change);

  // handle srcset
  if (saveFormat === 'html') {
    const r = await CaptureTool.captureImageSrcset(node, params);
    tasks.push(...r.tasks);
    return {change: change.merge(r.change), tasks};
  }

  return {change, tasks};
}

export default {capture};
