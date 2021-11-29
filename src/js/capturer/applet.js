import T      from '../lib/tool.js';
import SnapshotNodeChange from '../snapshot/change.js';
import CaptureTool from './tool.js';

// This element is Deprecated.
// @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/applet

/*!
 * Capture SnapshotNode APPLET
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
  const {config} = params;
  switch(config.htmlCaptureApplet) {
    case 'saveAll':
      return await captureSaveAll(node, params);
    case 'remove':
    default:
      return CaptureTool.captureRemoveNode();
  }
}


async function captureSaveAll(node, params) {
  const tasks = [];
  let change = new SnapshotNodeChange();

  const baseUrl = getCodeBaseUrl(node.attr.codebase, params.baseUrl);
  change.rmAttr('codebase');

  const attrParams = [
    {resourceType: 'Misc', attrName: 'code', baseUrl},
    {resourceType: 'Misc', attrName: 'archive', canEmpty: true},
  ];

  const r = await CaptureTool.captureAttrResource(node, params, attrParams);
  tasks.push(...r.tasks);
  change = change.merge(r.change);

  return {change, tasks};
}


function getCodeBaseUrl(codebase, baseUrl) {
  if (codebase) {
    const {isValid, url, message} = T.completeUrl(node.attr.codebase, baseUrl);
    return isValid ? url : baseUrl;
  } else {
    return baseUrl;
  }
}

export default {capture};
