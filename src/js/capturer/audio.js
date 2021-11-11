
import CapturerMedia from './media.js';

const ATTR_PARAMS_AUDIO  = {resourceType: 'Audio', attrName: 'src', canEmpty: true};
const ATTR_PARAMS_SOURCE = {resourceType: 'Audio', attrName: 'src', mimeTypeAttrName: 'type'};
const ATTR_PARAMS_TRACK  = {resourceType: 'TextTrack', attrName: 'src', extension: 'vtt'};

/*!
 * Capture SnapshotNode AUDIO
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
    ATTR_PARAMS_AUDIO,
    ATTR_PARAMS_SOURCE,
    ATTR_PARAMS_TRACK,
  ]);
}

export default {capture};
