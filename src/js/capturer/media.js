


import T      from '../lib/tool.js';
import Asset  from '../lib/asset.js';
import Task   from '../lib/task.js';
import SnapshotNodeChange from '../snapshot/change.js';
import CaptureTool from './tool.js';

/*!
 * Capture SnapshotNode MEDIA (AUDIO or VIDEO)
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 *   - {String} baseUrl
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {RequestParams} requestParams
 * @param {Array} attrParamsArray @see capturer/tool.js > captureAttrResource()
 *
 */


async function capture(node, params, [attrParamsMedia, attrParamsSource, attrParamsTrack]) {
  const tasks = [];
  let change = new SnapshotNodeChange();
  change.rmAttr('crossorigin');

  const r = await CaptureTool.captureAttrResource(node, params, attrParamsMedia);
  tasks.push(...r.tasks);
  change = change.merge(r.change);

  if (node.childNodes && node.childNodes.length > 0) {
    for (const childNode of node.childNodes) {
      switch (childNode.name) {
        case 'SOURCE': {
          // although we can remove source tags if the audio tag's src attribute is not empty
          // but we keep them, In case user want to correct the audio tag's src attribute.
          const result = await CaptureTool.captureAttrResource(childNode, params, attrParamsSource);
          tasks.push(...result.tasks);
          childNode.change = result.change.toObject();
          break;
        }

        case 'TRACK': {
          //WebVTT format.
          const result = await CaptureTool.captureAttrResource(childNode, params, attrParamsTrack);
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
