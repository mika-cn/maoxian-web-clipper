import T     from '../lib/tool.js';
import Task  from '../lib/task.js';
import Asset from '../lib/asset.js';
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
 *   - {Object} config
 *
 */
async function capture(node, params) {
  const {config, baseUrl} = params;
  if (config.htmlCaptureObject == 'remove') {
    return CaptureTool.captureRemoveNode();
  }

  const {isValid, url, message} = T.completeUrl(node.attr.data, baseUrl);
  if (!isValid) {
    // this defines not object. remove it
    const reason = `Invalid url, message: ${message}`
    return CaptureTool.captureRemoveNode(reason);
  }


  switch(config.htmlCaptureObject) {
    case 'saveImage':
      return await captureFilter(node, url, {params, filterText: '<images>'});
    case 'saveAll':
      return await captureSaveAll(node, url, params);
    case 'filter':
    default:
      return await captureFilter(node, url, {params,
      filterText: params.config.htmlObjectFilter});
  }
}


async function captureSaveAll(node, url, params) {
  const extension = T.getUrlExtension(url);
  const resourceType = Task.getResourceType(extension, node.attr.type);
  const attrParams = {resourceType, attrName: 'data', mimeTypeAttrName: 'type'};
  return await CaptureTool.captureAttrResource(node, params, attrParams);
}


async function captureFilter(node, url, {params, filterText}) {

  const mimeTypeData = {mimeType: node.attr.type};
  if (!node.attr.type) {
    mimeTypeData.webUrlMimeType = (await Asset.getWebUrlMimeType(params.requestParams.toParams(url)));
  }

  if (CaptureTool.isFilterMatch(filterText, url, mimeTypeData)) {
    return await captureSaveAll(node, url, params);
  } else {
    const reason = "Filter not match";
    return CaptureTool.captureRemoveNode(reason);
  }
}


export default {capture};
