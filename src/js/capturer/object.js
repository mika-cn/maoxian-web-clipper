import Task   from '../lib/task.js';
import CaptureTool from './tool.js';


/*!
 * Capture SnapshotNode OBJECT
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
  const resourceType = Task.getResourceType(node.attr.data, node.attr.type);
  const attrParams = {resourceType, attrName: 'data', mimeTypeAttrName: 'type'};
  return await CaptureTool.captureAttrResource(node, params, attrParams);
}

export default {capture};
