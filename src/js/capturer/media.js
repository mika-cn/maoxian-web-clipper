


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
 *   - {Object} config
 * @param {Array} attrParamsArray @see capturer/tool.js > captureAttrResource()
 *
 */
async function capture(node, params, [attrParamsMedia, attrParamsSource, attrParamsTrack]) {
  const {config} = params;
  const name = T.capitalize(node.name);
  const key = `htmlCapture${name}`
  const captureMethod = config[key];

  switch(captureMethod) {

    case 'saveAll': {
      const r = await captureMediaNode(node, params, attrParamsMedia);
      const childrenTasks = await captureMediaChildren(node, params, [attrParamsSource, attrParamsTrack]);
      r.tasks.push(...childrenTasks);
      return r;
    }
    case 'saveCurrent': {
      // HTMLMediaElement.currentSrc is an empty string
      // if the networkState property is EMPTY.
      //
      // WARNING: we don't pass currentSrc here.
      // do it in capturerAudio or capturerVideo
      const r = await captureMediaNode(node, params, attrParamsMedia);
      let childrenTasks = [];
      if (node.attr.src || node.currentSrc) {
        childrenTasks = await captureMediaChildren(node, params, [null, attrParamsTrack]);
      } else {
        // There's not current resource to save, save all.
        childrenTasks = await captureMediaChildren(node, params, [attrParamsSource, attrParamsTrack]);
      }

      r.tasks.push(...childrenTasks);

      return r;
    }

    case 'remove':
    default:
      return CaptureTool.captureRemoveNode();
  }
}


async function captureMediaNode(node, params, attrParamsMedia) {
  const tasks = [];
  let change = new SnapshotNodeChange();
  // We don't save js, so we need to
  // add controls attribute.
  change.setAttr('controls', "");
  change.rmAttr('autoplay');
  change.rmAttr('loop');
  change.rmAttr('muted');
  change.rmAttr('crossorigin');

  const r = await CaptureTool.captureAttrResource(node, params, attrParamsMedia);
  tasks.push(...r.tasks);
  change = change.merge(r.change);
  return {tasks, change};
}

async function captureMediaChildren(node, params, [attrParamsSource, attrParamsTrack]) {
  const tasks = [];

  if (node.childNodes && node.childNodes.length > 0) {
    for (const childNode of node.childNodes) {
      switch (childNode.name) {
        case 'SOURCE': {
          let result;
          if (attrParamsSource) {
            // although we can remove source tags if the audio tag's src attribute is not empty
            // but we keep them, In case user want to correct the audio tag's src attribute.
            result = await CaptureTool.captureAttrResource(childNode, params, attrParamsSource);
          } else {
            const reason = "capture method: currentSrc";
            result = CaptureTool.captureRemoveNode(reason);
          }
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
  return tasks;
}


export default {capture};
