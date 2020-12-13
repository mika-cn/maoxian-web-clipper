
import T        from '../lib/tool.js';
import Asset    from '../lib/asset.js';
import Task     from '../lib/task.js';
import Template from '../lib/template.js';

/*!
 * Capture Custom Element (shadow DOM)
 */


/**
 * @param {Object} opts
 *   - {String} saveFormat
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {Document} doc
 *   - {Hash} customElementHtmlDict
 *   - {Hash} customElementStyleDict
 *
 */

function capture(node, opts) {
  const {saveFormat, clipId, storageInfo, doc,
    customElementHtmlDict = {}, customElementStyleDict = {}} = opts;
  const tasks = [];
  const customElementId = node.getAttribute('data-mx-custom-element-id');

  if (saveFormat === 'html') {
    // We can't simply place html inside custom element tag.
    // Because we don't save javascript, that means those tags
    // won't be shadow DOM anymore.
    //
    // In order to keep the isolation of styles, we save them as
    // external iframes.
    //
    const style = customElementStyleDict[customElementId];
    const html = Template.customElemPage.render({
      html: customElementHtmlDict[customElementId],
    });
    const assetName = Asset.getNameByContent({ content: html, extension: 'frame.html', prefix: clipId});
    const filename = T.joinPath(storageInfo.frameFileFolder, assetName);
    const src = T.calcPath(
      storageInfo.mainFileFolder,
      T.joinPath(storageInfo.frameFileFolder, assetName)
    );
    const newNode = doc.createElement('iframe');
    newNode.setAttribute('src', src);
    newNode.setAttribute('width', '100%');
    newNode.setAttribute('height', `${style.height}px`);
    newNode.setAttribute('frameborder', '0');
    tasks.push(Task.createFrameTask(filename, html, clipId));
    node.removeAttribute('data-mx-custom-element-id');
    node.appendChild(newNode);
    return {node, tasks};
  } else {
    // md
    const newNode = doc.createElement('div');
    newNode.innerHTML = customElementHtmlDict[customElementId];
    node.parentNode.replaceChild(newNode, node);
    return {node: newNode, tasks: tasks}
  }
}

export default {capture};
