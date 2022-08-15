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

    if (config.htmlCaptureCssImage == 'remove') {
      change.setAttr('data-mx-original-background', (bg || ''));
      change.setAttr('background', '');
      return {change, tasks};
    }
    const params = {baseUrl, clipId, storageInfo, requestParams};
    const attrParams = {resourceType: 'image', attrName: 'background'};
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
        const resourceType = 'image';
        const httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url), resourceType);
        const {filename, path} = await Asset.getFilenameAndPath({
          link: url, mimeTypeData: {httpMimeType, attrMimeType},
          clipId, storageInfo, resourceType,
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
 *   - {String}  resourceType -  "image", "audio", "video" etc @see task.js
 *   - {String}  attrName - The name of target attribute
 *   - {String}  attrValue (optional) - The value to use instead of getting it from node.
 *   - {String}  baseUrl (optional) - The baseUrl to use instead of getting it from params
 *   - {String}  mimeTypeAttrName (optional) - The attribute that indicate the mime type.
 *   - {String}  attrMimeType (Optional) - the mime type that get from attribute (normally not from standard attribute)
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
      mimeTypeAttrName, attrMimeType, extension, canEmpty = false} = it;


    const attrValue = (_attrValue || node.attr[attrName]);
    const {isValid, url, message} = T.completeUrl(attrValue, (_baseUrl || baseUrl));

    if (isValid) {

      // deal mimeType
      const mimeTypeData = {};
      if (!extension) {
        if (attrMimeType) {
          mimeTypeData.attrMimeType = attrMimeType;
        }
        if ((!attrMimeType) && mimeTypeAttrName) {
          mimeTypeData.attrMimeType = node.attr[mimeTypeAttrName];
        }
        if (!mimeTypeData.attrMimeType) {
          mimeTypeData.httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url), resourceType);
        }
      }

      const {filename, path} = await Asset.getFilenameAndPath({
        link: url, extension, mimeTypeData, clipId, storageInfo, resourceType});

      const taskFnName = `create${T.capitalize1st(resourceType)}Task`;
      tasks.push(Task[taskFnName](filename, url, clipId, requestParams));
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
    "image": ["invalid-image.png", "image/png"],
    "audio": ["invalid-audio.mp3", "audio/mp3"],
    "video": ["invalid-video.mp4", "video/mp4"],
    "textTrack": ["invalid-text-track.vtt", "text/vtt"],
    "misc": ["invalid-url.misc", "custom/misc"],
  }[resourceType]);
  return {invalidUrl, invalidMimeType};
}


function captureRemoveNode(reason) {
  const tasks = [];
  let change = new SnapshotNodeChange();
  change.setProperty('ignore', true);
  change.setProperty(
    'ignoreReason',
    (reason || 'capture method: remove')
  );
  return {change, tasks};
}

// @returns {boolean}
function isFilterMatch(filterText, url, mimeType) {
  if (!filterText) { return false }
  const extension = Asset.getWebUrlExtension(url, {mimeType});
  const resourceType = Task.getResourceType(extension, mimeType);
  let match = false;

  T.eachNonCommentLine(filterText, (lineText) => {
    const items = lineText.split(',');
    for(const item of items) {
      const it = item.trim();
      switch (it) {
        case '<images>':
          match = resourceType == 'image';
          if (match) { return true }
          break;
        case '<audios>':
          match = resourceType == 'audio';
          if (match) { return true }
          break;
        case '<videos>':
          match = resourceType == 'video';
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

/**
 * @param {String} filterListText
 * @param {[Object]} resourceItems
 * @param {String} resourceItem.url
 * @param {Function} defaultHandler - execute if all filters can't match.
 */
// @returns {[boolean]} boolFlags
function matchFilterList(filterListText, resourceItems, defaultHandler) {
  const text = filterListText.trim();
  if (!text) { return defaultHandler(resourceItems)}
  const filterTexts = text.split('|').map((it) => it.trim());
  let result = [];
  for (const filterText of filterTexts) {
    const tmpArr = [];
    let matches = false;
    for (const resourceItem of resourceItems) {
      if (isFilterMatch(filterText, resourceItem.url)) {
        matches = true;
        tmpArr.push(true);
      } else {
        tmpArr.push(false);
      }
    }
    if (matches) {
      result = [...tmpArr];
      break;
    }
  }
  return result.length > 0 ? result : defaultHandler(resourceItems);
}




export default {
  captureBackgroundAttr,
  captureImageSrcset,
  captureAttrResource,
  captureRemoveNode,
  parseSrcset,
  isFilterMatch,
  matchFilterList,
};
