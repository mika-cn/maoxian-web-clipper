"use strict";

import Asset  from '../lib/asset.js';
import Task   from '../lib/task.js';
import SnapshotNodeChange from '../snapshot/change.js';

/*!
 * Capture SnapshotNode CANVAS
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 *   - {String} saveFormat
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {RequestParams} requestParams
 *
 */

async function capture(node, {saveFormat, clipId, storageInfo, requestParams}) {
  const tasks = [];
  const change = new SnapshotNodeChange();

  if (node.dataUrl) {

    const {filename, path} = await Asset.getFilenameAndPath({
      link: node.dataUrl, mimeTypeData: {},
      clipId, storageInfo,
    });

    tasks.push(Task.createImageTask(filename, node.dataUrl, clipId, requestParams));

    if (saveFormat === 'html') {
      change.setStyleProperty('background-image', `url('${path}') !important`);
    } else {
      change.setProperty('name', 'IMG');
      change.setAttr('src', path);
    }
  } else {
    // tained canvas
    change.setAttr('data-mx-ignore-me', 'true');
  }
  return {change, tasks};
}

export default {capture};
