"use strict";

import T        from '../lib/tool.js';
import Asset    from '../lib/asset.js';
import Task     from '../lib/task.js';

import SnapshotNodeChange from '../snapshot/change.js';
import SnapshotMaker from '../snapshot/maker.js';

/*!
 * Capture Element Iframe
 */


/**
 * @param {Snapshot} node
 * @param {Object} opts
 *   - {String} saveFormat
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {String} html
 */

async function capture(node, opts) {
  const {clipId, saveFormat, storageInfo, html} = opts;

  const tasks = [];
  const change = new SnapshotNodeChange();

  if (saveFormat == 'html') {

    if (node.errorMessage) {
      const srcDoc = getBlankFrameHtml(node);
      change.setAttr('srcdoc', srcDoc);
      change.rmAttr('src');
      return {change, tasks};

    } else {

      let name, id;
      if (node.frame.url === 'about:srcdoc') {
        name = Asset.getNameByContent({
          template: storageInfo.raw.frameFileName,
          content: html,
          extension: 'frame.html',
          now: storageInfo.valueObj.now,
        })
        // because the urls of inline frames always the same
        // so we can't use it as id, use name instead which
        // is depends on the html content.
        id = name;
      } else {
        name = Asset.getNameByLink({
          template: storageInfo.raw.frameFileName,
          link: node.frame.url,
          extension: 'frame.html',
          now: storageInfo.valueObj.now,
        });
        id = node.frame.url;
      }

      const assetName = await Asset.getUniqueName({
        clipId: clipId,
        id: id,
        folder: storageInfo.frameFileFolder,
        filename: name,
      });

      const filename = T.joinPath(storageInfo.frameFileFolder, assetName);
      const src = T.calcPath(storageInfo.mainFileFolder, filename);
      tasks.push(Task.createFrameTask(filename, html, clipId));
      change.setAttr('src', src);
      change.rmAttr('srcdoc');
      change.rmAttr('referrerpolicy');
      return {change, tasks}
    }

  } else {

    if (node.errorMessage) {
      change.setProperty('ignore', true);
      change.setProperty('ignoreReason', node.errorMessage);
      return {change, tasks}

    } else {
      // html contains "<html><body>..</body></html>" which
      // will be removed at DOMTool.parseHTML (clip-as-markdown.js)
      const newNode = SnapshotMaker.getHtmlStrNode(`<div>${html}</div>`);
      // replace self
      change.setProperty('type', newNode.type);
      change.setProperty('name', newNode.name);
      change.setProperty('html', newNode.html);
      return {change, tasks}
    }

  }

}

function getBlankFrameHtml(node) {
  const errors = [];
  if (node.url) {
    errors.push(`Url: ${node.url}`);
  }
  errors.push(`Error: ${node.errorMessage}`);
  return `<div>${errors.join("<br />")}</div>`;
}


export default {capture};
