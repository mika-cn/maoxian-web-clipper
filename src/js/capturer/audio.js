
import CapturerMedia from './media.js';

const ATTR_PARAMS_AUDIO  = {resourceType: 'audio', attrName: 'src', canEmpty: true};
const ATTR_PARAMS_SOURCE = {resourceType: 'audio', attrName: 'src', mimeTypeAttrName: 'type'};
const ATTR_PARAMS_TRACK  = {resourceType: 'textTrack', attrName: 'src', extension: 'vtt'};

/*!
 * Capture SnapshotNode AUDIO
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 *   - {String} baseUrl
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {RequestParams} requestParams
 *   - {Object} config
 *
 */

async function capture(node, params) {
  let attrParamsChange = {};
  if (params.config.htmlCaptureAudio === 'saveCurrent') {
    attrParamsChange.attrValue = node.currentSrc;
  }

  let attrParamsMedia = Object.assign(
    attrParamsChange,
    ATTR_PARAMS_AUDIO
  );

  return await CapturerMedia.capture(node, params, [
    attrParamsMedia,
    ATTR_PARAMS_SOURCE,
    ATTR_PARAMS_TRACK,
  ]);
}

export default {capture};
