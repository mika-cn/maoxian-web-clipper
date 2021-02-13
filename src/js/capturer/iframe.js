"use strict";

import Log      from '../lib/log.js';
import T        from '../lib/tool.js';
import ExtMsg   from '../lib/ext-msg.js';
import Asset    from '../lib/asset.js';
import Task     from '../lib/task.js';
import Template from '../lib/template.js';

/*!
 * Capture Element Iframe
 */


/**
 * @param {Node} node
 * @param {Object} opts
 *   - {String} saveFormat
 *   - {Integer} parentFrameId
 *   - {String} baseUrl
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {Document} doc
 *   - {Array} frames
 *   - {Object} config
 */

async function capture(node, opts) {
  const {parentFrameId, baseUrl, clipId, saveFormat,
    storageInfo, doc, frames, config} = opts;
  const srcdoc = node.getAttribute('srcdoc');
  const src = node.getAttribute('src');
  const tasks = [];

  // in content script, frameNode.contentWindow is undefined.
  // window.frames includes current layer frames.
  //   firefox: all frames (includes frame outside body node)
  //   chrome: frames inside body node.

  if (srcdoc) {
    // inline iframe
    // assetName = Asset.getNameByContent({content: srcdoc, extension: 'frame.html'});
    // TODO ?
    node.setAttribute('data-mx-warn', 'srcdoc attribute was not captured by MaoXian');
    return {node, tasks};
  }

  const r = T.completeUrl(src, baseUrl);
  const {isValid, url, message} = r;

  if (!isValid) {
    const newNode = doc.createElement('div');
    newNode.setAttribute('data-mx-warn', message);
    newNode.setAttribute('data-mx-original-src', src);
    node.parentNode.replaceChild(newNode, node);
    return {node: newNode, tasks: tasks};
  }

  if (T.isBrowserExtensionUrl(url)) {
    const newNode = doc.createElement('div');
    newNode.setAttribute('data-mx-ignore-me', 'true');
    node.parentNode.replaceChild(newNode, node);
    return {node: newNode, tasks: tasks};
  }

  const frame = frames.find((it) => it.originalUrl === url && it.parentFrameId === parentFrameId);
  if (!frame) {
    Log.error("Could not find frame with url: ", url);
    Log.error("Frames: ");
    frames.forEach((it) => {
      Log.error(it);
    });
    node.setAttribute('data-mx-original-src', src);
    node.setAttribute('data-mx-original-url', url);
    node.removeAttribute('src');
    return {node, tasks}

  } else if(frame.errorOccurred) {

    node.setAttribute('data-mx-warn', 'the last navigation in this frame was interrupted by an error');
    node.setAttribute('data-mx-original-src', src);
    node.setAttribute('data-mx-original-url', url);
    node.removeAttribute('src');
    return {node, tasks}
  }

  node.removeAttribute('referrerpolicy');

  const msgType = saveFormat === 'html' ? 'frame.toHtml' : 'frame.toMd';
  try {
    const {fromCache, result} = await ExtMsg.sendToBackend('clipping', {
      type: msgType,
      frameId: frame.frameId,
      frameUrl: frame.url,
      body: { clipId, frames, storageInfo,
        config }
    });

    if (fromCache) {
      // processed
      if (saveFormat === 'html') {
        const assetName = Asset.getNameByLink({ link: frame.url, extension: 'frame.html', prefix: clipId});
        const src = T.calcPath(
          storageInfo.mainFileFolder,
          T.joinPath(storageInfo.frameFileFolder, assetName)
        );
        node.setAttribute('src', src);
        return {node, tasks};
      } else {
        const {elemHtml} = result;
        const newNode = doc.createElement('div');
        newNode.innerHTML = elemHtml;
        node.parentNode.replaceChild(newNode, node);
        return {node: newNode, tasks: tasks}
      }
    } else {
      const {elemHtml, headInnerHtml, title, tasks: _tasks} = result;
      tasks.push(..._tasks);
      if (saveFormat === 'html') {
        const html = Template.framePage.render({
          originalSrc: frame.url,
          title: (title || ""),
          headInnerHtml: headInnerHtml,
          html: elemHtml
        });
        const assetName = Asset.getNameByLink({ link: frame.url, extension: 'frame.html', prefix: clipId});
        const filename = T.joinPath(storageInfo.frameFileFolder, assetName);
        const src = T.calcPath(
          storageInfo.mainFileFolder,
          T.joinPath(storageInfo.frameFileFolder, assetName)
        );
        node.setAttribute('src', src);
        tasks.push(Task.createFrameTask(filename, html, clipId));
        return {node, tasks};
      } else {
        const newNode = doc.createElement('div');
        newNode.innerHTML = elemHtml;
        node.parentNode.replaceChild(newNode, node);
        return {node: newNode, tasks: tasks}
      }
    }
  } catch(e) {
    Log.error(e);
    // Frame page failed to load (mainly caused by network problem)
    // ExtMsg.sendToContentFrame resolve undefined.
    // (catched by ExtMsg.sendToTab).
    node.setAttribute('data-mx-warn', 'Frame page failed to load')
    node.setAttribute('data-mx-original-src', url);
    node.removeAttribute('src');
    return {node, tasks};
  }

}

export default {capture};
