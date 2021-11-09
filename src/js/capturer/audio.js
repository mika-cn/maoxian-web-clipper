
import T      from '../lib/tool.js';
import Asset  from '../lib/asset.js';
import Task   from '../lib/task.js';
import SnapshotNodeChange from '../snapshot/change.js';
import CaptureTool from './tool.js';


const ATTR_PARAMS_SOURCE = {resourceType: 'Audio', attrName: 'src', mimeTypeAttrName: 'type'};
const ATTR_PARAMS_AUDIO  = Object.assign({canEmpty: true}, ATTR_PARAMS_SOURCE);
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
  const tasks = [];
  let change = new SnapshotNodeChange();
  change.rmAttr('crossorigin');

  const r = await CaptureTool.captureAttrResource(node, params, ATTR_PARAMS_AUDIO);
  tasks.push(...r.tasks);
  change = change.merge(r.change);

  if (node.childNodes && node.childNodes.length > 0) {
    for (const childNode of node.childNodes) {
      switch (childNode.name) {
        case 'SOURCE': {
          // although we can remove source tags if the audio tag's src attribute is not empty
          // but we keep them, In case user want to correct the audio tag's src attribute.
          const result = await CaptureTool.captureAttrResource(childNode, params, ATTR_PARAMS_SOURCE);
          tasks.push(...result.tasks);
          childNode.change = result.change.toObject();
          break;
        }

        case 'TRACK': {
          //WebVTT format.
          const result = await CaptureTool.captureAttrResource(childNode, params, ATTR_PARAMS_TRACK);
          tasks.push(...result.tasks);
          childNode.change = result.change.toObject();
          break;
        }
        default: {
          // we don't save fallback content.
          break;
        }
      }
    }
  }

  return {change, tasks};
}

export default {capture};
