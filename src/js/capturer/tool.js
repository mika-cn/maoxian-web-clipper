"use strict";

import T     from '../lib/tool.js';
import Asset from '../lib/asset.js';
import Task  from '../lib/task.js';
import SnapshotNodeChange from '../snapshot/change.js';



async function captureBackgroundAttr(node, {baseUrl, storageInfo, config, requestParams, clipId}) {
  let change = new SnapshotNodeChange();
  const tasks = [];

  if (node.attr.background) {
    const bg = node.attr.background;

    if (!config.saveCssImage) {
      change.setAttr('data-mx-original-background', (bg || ''));
      change.setAttr('background', '');
      return {change, tasks};
    }
    const params = {baseUrl, clipId, storageInfo, requestParams};
    const attrParams = {resourceType: 'Image', attrName: 'background'};
    const r = await captureAttrResource(node, params, attrParams);
    tasks.push(...r.tasks);
    change = change.merge(r.change);
  }
  return {change, tasks}
}

/**
 * capture srcset of <img> element
 * and <source> element in <picture>
 * @return {Object} {:change, :tasks}
 */
async function captureImageSrcset(node, {baseUrl, storageInfo, requestParams, clipId }) {
  const srcset = node.attr.srcset;
  const tasks = [];
  const change = new SnapshotNodeChange();
  if (srcset) {
    const arr = parseSrcset(srcset);
    let attrMimeType = null;
    if (node.name === 'SOURCE') {
      attrMimeType = node.attr.type;
    }
    const newArr = [];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const [itemSrc] = item;
      const {isValid, url, message} = T.completeUrl(itemSrc, baseUrl);
      if (isValid) {
        const httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));
        const {filename, path} = await Asset.getFilenameAndPath({
          link: url, mimeTypeData: {httpMimeType, attrMimeType},
          clipId, storageInfo,
        });

        tasks.push(Task.createImageTask(filename, url, clipId, requestParams));
        item[0] = path;
      } else {
        item[0] = 'invalid-url.png';
      }
      newArr.push(item.join(' '));
    }
    change.setAttr('srcset', newArr.join(','));
  }
  return {change, tasks};
}

/**
 *
 * @param {String} srcset
 *
 * @return {Array} srcset
 *   - {Array} item
 *     - {String} url
 *     - {String} widthDescriptor
 *      or pixelDensityDescriptor (optional)
 *
 */
function parseSrcset(srcset) {
  const result = [];
  let currItem = [];
  let str = '';
  for (let i = 0; i < srcset.length; i++) {
    const currChar = srcset[i];
    switch(currChar) {
      case ',':
        const nextChar = srcset[i + 1];
        if (// is going to start a new item
            nextChar && nextChar === ' '
            // or current str is a descriptor
            // (end of item)
          || str.match(/^[\d\.]+[xw]{1}$/)
        ) {
          if (str !== '') {
            currItem.push(str);
            result.push(Array.of(...currItem));
            str = '';
            currItem = [];
          }
        } else {
          str += currChar;
        }
        break;
      case ' ':
        if (str !== '') {
          currItem.push(str);
          str = '';
        }
        break;
      default:
        str += currChar
    }
  }
  if (str !== '') {
    currItem.push(str);
    result.push(Array.of(...currItem));
    str = '';
    currItem = [];
  }
  return result;
}




/**
 * @param {Snapshot} node
 * @param {Object} params
 * @param {Object|Array} attrParams
 *   - {String}  resourceType -  Avariable values are "Image", "Audio", "Video", "TextTrack" and "Misc"
 *   - {String}  attrName - The name of target attribute
 *   - {String}  attrValue (optional) - The value to use instead of getting it from node.
 *   - {String}  baseUrl (optional) - The baseUrl to use instead of getting it from params
 *   - {String}  mimeTypeAttrName (optional) - The attribute that indicate the mime type.
 *   - {String}  extension (optional) - The target file extension to save.
 *   - {Boolean} canEmpty (optional) - Can this attribute be empty, default is false.
 *
 * @return {Object} {:change, tasks}
 */
async function captureAttrResource(node, params, attrParams) {
  const {baseUrl, clipId, storageInfo, requestParams} = params;
  const change = new SnapshotNodeChange();
  const tasks = [];
  const defaultV = {captureResouce: true, canEmpty: false};
  const attrParamsArr = T.toArray(attrParams);

  for (const it of attrParamsArr) {

    const {resourceType, attrName, attrValue: _attrValue, baseUrl: _baseUrl,
      mimeTypeAttrName, extension, canEmpty = false} = it;


    const attrValue = (_attrValue || node.attr[attrName]);
    const {isValid, url, message} = T.completeUrl(attrValue, (_baseUrl || baseUrl));

    if (isValid) {

      // deal mimeType
      const mimeTypeData = {};
      if (!extension) {
        if (mimeTypeAttrName) {
          mimeTypeData.attrMimeType = node.attr[mimeTypeAttrName];
        }
        if (!mimeTypeData.attrMimeType) {
          mimeTypeData.httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));
        }
      }

      const {filename, path} = await Asset.getFilenameAndPath({
        link: url, extension, mimeTypeData, clipId, storageInfo});

      tasks.push(Task[`create${resourceType}Task`](filename, url, clipId, requestParams));
      change.setAttr(attrName, path);


    } else {


      const isEmptyError = message.match(/^empty/i);
      if (!(isEmptyError && canEmpty)) {
        change.setAttr('data-mx-warn', message);
      }

      if (attrValue === undefined || attrValue === null) {
        // The target attribute is not exist at all

      } else if (attrValue === "") {
        change.setAttr(`data-mx-original-${attrName}`, attrValue);

      } else {
        // Other non-empty values.

        const {invalidUrl, invalidMimeType} = getInvalidValue(resourceType);

        change.setAttr(`data-mx-original-${attrName}`, attrValue);
        change.setAttr(attrName, invalidUrl);

        if (mimeTypeAttrName && node.attr[mimeTypeAttrName]) {
          change.setAttr(`data-mx-original-${mimeTypeAttrName}`, node.attr[mimeTypeAttrName]);
          change.setAttr(mimeTypeAttrName, invalidMimeType);
        }
      }



    }


  }

  return {change, tasks};
}



function getInvalidValue(resourceType) {
  const [invalidUrl, invalidMimeType] = ({
    "Image": ["invalid-image.png", "image/png"],
    "Audio": ["invalid-audio.mp3", "audio/mp3"],
    "Video": ["invalid-video.mp4", "video/mp4"],
    "TextTrack": ["invalid-text-track.vtt", "text/vtt"],
    "Misc": ["invalid-url.misc", "custom/misc"],
  }[resourceType]);
  return {invalidUrl, invalidMimeType};
}


function captureRemoveNode() {
  const tasks = [];
  let change = new SnapshotNodeChange();
  change.setProperty('ignore', true);
  change.setProperty('ignoreReason', 'capture method: remove');
  return {change, tasks};
}

function isFilterMatch(filterText, url, mimeType) {
  if (!filterText) { return false }
  const resourceType = Task.getResourceType(url, mimeType);
  const extension = Task.getFileExtension(url, mimeType);
  let match = false;

  T.eachNonCommentLine(filterText, (lineText) => {
    const items = lineText.split(',');
    for(const item of items) {
      const it = item.trim();
      switch (it) {
        case '<images>':
          match = resourceType == 'Image';
          if (match) { return true }
          break;
        case '<audios>':
          match = resourceType == 'Audio';
          if (match) { return true }
          break;
        case '<videos>':
          match = resourceType == 'Video';
          if (match) { return true }
          break;
        default:
          match = extension && extension == it;
          if (match) { return true }
          break;
      }
    }
  });

  return match;
}




export default {
  captureBackgroundAttr,
  captureImageSrcset,
  captureAttrResource,
  captureRemoveNode,
  parseSrcset,
  isFilterMatch,
};
