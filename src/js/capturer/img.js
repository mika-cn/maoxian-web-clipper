"use strict";

import T           from '../lib/tool.js';
import Asset       from '../lib/asset.js';
import Task        from '../lib/task.js';
import CaptureTool from './tool.js';
import SnapshotNodeChange from '../snapshot/change.js';

const ATTR_PARAMS_IMG = {resourceType: 'image', attrName: 'src'}

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
  const attrMimeType = getAttrMimeType(node);
  if (attrMimeType) {
    attrParams = Object.assign({attrMimeType}, attrParams);
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


// Some images' url is a API and the mimeType are stored on attribute.
// e.g.: <img src="//a.org/get-pic.image?id=xxx" mime_type="image/png">
function getAttrMimeType(node) {
  for (const name in node.attr) {
    if (['src', 'srcset', 'data-src', 'data-srcset', 'alt', 'title'].indexOf(name) > -1) {
      continue;
    }
    const value = node.attr[name];
    if (value.startsWith('image/') && value.lastIndexOf('/') == 5 && T.mimeType2Extension(value) !== '') {
      return value;
    }
  }
  return undefined;
}

export default {capture};
