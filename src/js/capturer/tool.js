"use strict";

import T     from '../lib/tool.js';
import Asset from '../lib/asset.js';
import Task  from '../lib/task.js';

async function captureBackgroundAttr(node, {baseUrl, storageInfo, config, requestParams, clipId}) {
  if (node.hasAttribute('background')) {
    const bg = node.getAttribute('background');

    if (!config.saveCssImage) {
      node.setAttribute('data-mx-original-background', (bg || ''));
      node.setAttribute('background', '');
      return {node: node, tasks: []};
    }
    const {isValid, url, message} = T.completeUrl(bg, baseUrl);
    if (isValid) {
      const httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));
      const {filename, path} = Asset.calcInfo(url, storageInfo, {httpMimeType: httpMimeType}, clipId);
      const task = Task.createImageTask(filename, url, clipId);
      node.setAttribute('background', path);
      return {node: node, tasks: [task]};
    } else {
      node.setAttribute('data-mx-warn', message);
      node.setAttribute('data-mx-original-background', (bg || ''));
      node.setAttribute('background', '');
    }
  }
  return {node: node, tasks: []}
}

/**
 * capture srcset of <img> element
 * and <source> element in <picture>
 * @return {Array} imagetasks
 */
async function captureImageSrcset(node, {baseUrl, storageInfo, requestParams, clipId }) {
  const srcset = node.getAttribute('srcset');
  const tasks = [];
  if (srcset) {
    const arr = parseSrcset(srcset);
    let attrMimeType = null;
    if (node.tagName.toUpperCase() === 'SOURCE') {
      attrMimeType = node.getAttribute('type');
    }
    const newArr = [];
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const [itemSrc] = item;
      const {isValid, url, message} = T.completeUrl(itemSrc, baseUrl);
      if (isValid) {
        const httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));
        const {filename, path} = Asset.calcInfo(url, storageInfo, {
          httpMimeType: httpMimeType,
          attrMimeType: attrMimeType
        }, clipId);
        const task = Task.createImageTask(filename, url, clipId);
        tasks.push(task);
        item[0] = path;
      } else {
        item[0] = 'invalid-url.png';
      }
      newArr.push(item.join(' '));
    }
    node.setAttribute('srcset', newArr.join(','));
  }
  return {node, tasks};
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

export default {
  captureBackgroundAttr,
  captureImageSrcset,
  parseSrcset,
};
