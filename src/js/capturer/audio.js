
import T      from '../lib/tool.js';
import Asset  from '../lib/asset.js';
import Task   from '../lib/task.js';
import SnapshotNodeChange from '../snapshot/change.js';
import CapturerTrack from './track.js';


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

  const r = await captureAudioAttrs(node, params, {ignoreEmptyError: true});
  tasks.push(...r.tasks);
  change = change.merge(r.change);

  if (node.childNodes && node.childNodes.length > 0) {
    for (const childNode of node.childNodes) {
      switch (childNode.name) {
        case 'SOURCE': {
          // although we can remove source tags if the audio tag's src attribute is not empty
          // but we keep them, In case user want to correct the audio tag's src attribute.
          const result = await captureAudioAttrs(childNode, params);
          tasks.push(...result.tasks);
          childNode.change = result.change.toObject();
          break;
        }
        case 'TRACK': {
          const result = await CapturerTrack.capture(childNode, params);
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



/**
 * capture src attribute
 */
async function captureAudioAttrs(node, params, options = {}) {
  const {baseUrl, clipId, storageInfo, requestParams} = params;
  const {ignoreEmptyError = false } = options;
  const tasks = [];
  const change = new SnapshotNodeChange();

  // handle src
  const src = node.attr.src;
  const {isValid, url, message} = T.completeUrl(src, baseUrl);

  if (isValid) {
    const attrMimeType = node.attr.type;
    let httpMimeType;

    if (!attrMimeType) {
      httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));
    }

    const {filename, path} = await Asset.getFilenameAndPath({
      link: url, mimeTypeData: {attrMimeType, httpMimeType},
      clipId, storageInfo,
    });

    tasks.push(Task.createAudioTask(filename, url, clipId, requestParams));
    change.setAttr('src', path);
  } else {
    const isEmptyError = message.match(/^empty/i);
    if (!(isEmptyError && ignoreEmptyError)) {
      change.setAttr('data-mx-warn', message);
    }
    if (src) {
      change.setAttr('data-mx-original-src', src);
      change.setAttr('src', 'invalid-audio-url.mp3');
    }
    if (node.attr.type) {
      change.setAttr('data-mx-original-type', node.attr.type);
      change.setAttr('type', 'audio/mpeg');
    }
  }

  return {change, tasks, isValid, message}
}

export default {capture};
