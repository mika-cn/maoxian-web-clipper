"use strict";

import T           from '../lib/tool.js';
import Asset       from '../lib/asset.js';
import Task        from '../lib/task.js';
import CaptureTool from './tool.js';
import SnapshotNodeChange from '../snapshot/change.js';

const ATTR_PARAMS_IMG = {resourceType: 'Image', attrName: 'src'}

/**
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 * @param {String} params.saveFormat
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
  const {saveFormat, baseUrl, clipId, storageInfo, requestParams, config} = params;
  const tasks = [];
  let change = new SnapshotNodeChange();

  change.rmAttr('crossorigin');
  // referrerpolicy attribute

  // handle src
  let attrParams = ATTR_PARAMS_IMG;
  if (config.htmlCaptureImage == 'saveCurrent') {
    attrParams = Object.assign({attrValue: node.currentSrc}, attrParams);
  }
  const r = await CaptureTool.captureAttrResource(node, params, attrParams);
  tasks.push(...r.tasks);
  change = change.merge(r.change);

  // handle srcset
  if (saveFormat === 'html' && config.htmlCaptureImage == 'saveAll') {
    const r = await CaptureTool.captureImageSrcset(node, params);
    tasks.push(...r.tasks);
    return {change: change.merge(r.change), tasks};
  } else {
    change.rmAttr('srcset');
  }

  return {change, tasks};
}

export default {capture};
