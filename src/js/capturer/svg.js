"use strict";

import T           from '../lib/tool.js';
import Asset       from '../lib/asset.js';
import Task        from '../lib/task.js';
import SnapshotNodeChange from '../snapshot/change.js';

/**
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 * @param {String} params.clipId
 * @param {Object} params.storageInfo
 *
 * @returns {Object} result
 *
 */

// If there hasn't "xmlns" attribute
// we should add one: xmlns="http://www.w3.org/2000/svg"
async function capture(node, params) {
  const {clipId, storageInfo} = params;

  const tasks = [];
  const change = new SnapshotNodeChange();

  if (node.mxAttr && node.mxAttr.saveAsImg) {
    // turn <svg> to <img>
    change.setProperty('name', 'IMG');

    // remove all attributes
    for (let name in node.attr) {
      change.rmAttr(name);
    }

    const xml = node.xml;
    const id = Asset.md5(xml);
    const name = Asset.getNameByContent({
      template: storageInfo.raw.assetFileName,
      valueObj: storageInfo.valueObj,
      content: xml,
      name: 'svg-image',
      extension: 'svg',
    })

    const assetName = await Asset.getUniqueName({
      clipId: clipId,
      id: id,
      folder: storageInfo.assetFolder,
      filename: name,
    });

    const filename = T.joinPath(storageInfo.assetFolder, assetName);
    const src = T.calcPath(storageInfo.mainFileFolder, filename);
    change.setAttr('src', src);
    tasks.push(Task.createSvgImageTask(filename, xml, clipId));
  }

  return {change, tasks};

}

export default {capture};
