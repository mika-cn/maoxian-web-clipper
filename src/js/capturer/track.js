
import T      from '../lib/tool.js';
import Asset  from '../lib/asset.js';
import Task   from '../lib/task.js';
import SnapshotNodeChange from '../snapshot/change.js';


/*!
 * Capture SnapshotNode Track
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 *   - {String} baseUrl
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {RequestParams} requestParams
 *
 */

async function capture(node, {baseUrl, clipId, storageInfo, requestParams}) {
  const tasks = [];
  const change = new SnapshotNodeChange();

  // handle src
  const src = node.attr.src;
  const {isValid, url, message} = T.completeUrl(src, baseUrl);

  if (isValid) {
    // The tracks are formatted in WebVTT format.
    const extension = 'vtt';
    const {filename, path} = await Asset.getFilenameAndPath({
      link: url, extension, clipId, storageInfo});
    tasks.push(Task.createTextTrackTask(filename, url, clipId, requestParams));
    change.setAttr('src', path);
  } else {
    change.setAttr('data-mx-warn', message);
    if (src) {
      change.setAttr('data-mx-original-src', src);
      change.setAttr('src', 'invalid-track.vtt');
    }
  }

  return {change, tasks};
}

export default {capture};
