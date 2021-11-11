import Task   from '../lib/task.js';
import CaptureTool from './tool.js';


/*!
 * Capture SnapshotNode Embed
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
  const resourceType = Task.getResourceType(node.attr.url, node.attr.type);
  const attrParams = {resourceType, attrName: 'src', mimeTypeAttrName: 'type'};
  return await CaptureTool.captureAttrResource(node, params, attrParams);
}

export default {capture};
