
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
 *   - {Object} config
 *
 */

async function capture(node, params) {
  let attrParamsMedia = ATTR_PARAMS_VIDEO;
  if (params.config.htmlCaptureVideo === 'saveCurrent') {
    attrParamsMedia[0] = Object.assign(
      {attrValue: node.currentSrc},
      attrParamsMedia[0]
    );
  }
  const r = await CapturerMedia.capture(node, params, [
    attrParamsMedia,
    ATTR_PARAMS_SOURCE,
    ATTR_PARAMS_TRACK,
  ]);

  r.change.rmAttr("controlslist");
  r.change.rmAttr("disablepictureinpicture");
  r.change.rmAttr("autopictureinpicture");
  return r;
}

export default {capture};
