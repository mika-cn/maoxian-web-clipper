
import T     from '../lib/tool.js';
import Asset from '../lib/asset.js';
import Task  from '../lib/task.js';

import SnapshotNodeChange from '../snapshot/change.js';
import SnapshotMaker from '../snapshot/maker.js';


/**
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 * @param {String} params.clipId
 * @param {Object} params.storageInfo
 * @param {String} params.xml
 *
 * @returns {Object} result
 *
 */
async function capture(node, params = {}) {
  const {clipId, storageInfo, xml} = params;

  const tasks = [];
  const change = new SnapshotNodeChange();

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
  tasks.push(Task.createSvgImageTask(filename, xml, clipId));


  // turn <mx-svg-img> to <img>
  const newNode = SnapshotMaker.getHtmlStrNode(`<img src="${src}">`);
  // replace self
  change.setProperty('type', newNode.type);
  change.setProperty('name', newNode.name);
  change.setProperty('html', newNode.html);

  return {change, tasks};
}

export default {capture};
