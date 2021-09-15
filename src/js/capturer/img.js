"use strict";

import T           from '../lib/tool.js';
import Asset       from '../lib/asset.js';
import Task        from '../lib/task.js';
import CaptureTool from './tool.js';
import SnapshotNodeChange from '../snapshot/change.js';

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
  const change = new SnapshotNodeChange();

  change.rmAttr('crossorigin');
  // referrerpolicy attribute

  // handle src
  const src = node.attr.src;
  const {isValid, url, message} = T.completeUrl(src, baseUrl);
  if (isValid) {
    const httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));
    const {filename, path} = await Asset.getFilenameAndPath({
      link: url, mimeTypeData: {httpMimeType},
      clipId, storageInfo,
    });

    tasks.push(Task.createImageTask(filename, url, clipId, requestParams));
    change.setAttr('src', path);
  } else {
    change.setAttr('data-mx-warn', message);
    change.setAttr('data-mx-original-src', (src || ''));
    change.setAttr('src', 'invalid-url.png');
  }

  // handle srcset
  if (saveFormat === 'html') {
    const r = await CaptureTool.captureImageSrcset(node, params);
    tasks.push(...r.tasks);
    return {change: change.merge(r.change), tasks};
  }

  return {change, tasks};
}

export default {capture};
