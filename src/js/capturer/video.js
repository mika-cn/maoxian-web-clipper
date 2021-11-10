

import T      from '../lib/tool.js';
import Asset  from '../lib/asset.js';
import Task   from '../lib/task.js';
import SnapshotNodeChange from '../snapshot/change.js';
import CapturerMedia from './media.js';


const ATTR_PARAMS_VIDEO  = [
  {resourceType: 'Video', attrName: 'src',    canEmpty: true},
  {resourceType: 'Image', attrName: 'poster', canEmpty: true},
];
const ATTR_PARAMS_SOURCE = {resourceType: 'Video', attrName: 'src', mimeTypeAttrName: 'type'};
const ATTR_PARAMS_TRACK  = {resourceType: 'TextTrack', attrName: 'src', extension: 'vtt'};

/*!
 * Capture SnapshotNode VIDEO
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 *   - {String} baseUrl
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {RequestParams} requestParams
 *
 */

async function capture(node, params) {
  return await CapturerMedia.capture(node, params, [
    ATTR_PARAMS_VIDEO,
    ATTR_PARAMS_SOURCE,
    ATTR_PARAMS_TRACK,
  ]);
}

export default {capture};
