"use strict";

import Asset       from '../lib/asset.js';
import Task        from '../lib/task.js';

/*!
 * Capture Element canvas
 *
 * @param {Node} node
 * @param {Object} opts
 *   - {String} saveFormat
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {Document} doc
 *   - {Hash} canvasDataUrlDict
 *
 */

function capture(node, opts) {
  const {saveFormat, clipId, storageInfo,
    doc, canvasDataUrlDict = {}} = opts;
  const tasks = [];
  if (node.getAttribute('data-mx-marker') === 'canvas-image') {
    const dataUrl = canvasDataUrlDict[node.getAttribute('data-mx-id')];
    const mimeTypeData = {};
    const {filename, path} = Asset.calcInfo(dataUrl, storageInfo, mimeTypeData, clipId);
    const task = Task.createImageTask(filename, dataUrl, clipId);
    tasks.push(task);

    if (saveFormat === 'html') {
      node.style.setProperty('background-image', `url(${path})`, 'important');
      node.setAttribute('data-mx-dont-capture-style', 'true');
      node.removeAttribute('data-mx-marker');
      node.removeAttribute('data-mx-id');
      return {node, tasks};

    } else {

      const newNode = doc.createElement('img');
      newNode.setAttribute('src', path);
      node.parentNode.replaceChild(newNode, node);
      return {node: newNode, tasks: tasks}
    }
  } else {
    node.setAttribute('data-mx-ignore-me', 'true');
    return {node, tasks};
  }
}

export default {capture};
