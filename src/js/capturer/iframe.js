;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    const process = require('process');
    if (process.env.MX_WC_TESTING) {
      module.exports = factory;
    } else {
      module.exports = factory(
        require('../lib/log.js'),
        require('../lib/tool.js'),
        require('../lib/ext-msg.js'),
        require('../lib/asset.js'),
        require('../lib/task.js'),
        require('../lib/template.js')
      );
    }
  } else {
    // browser or other
    root.MxWcCapturerIframe = factory(
      root.MxWcLog,
      root.MxWcTool,
      root.MxWcExtMsg,
      root.MxWcAsset,
      root.MxWcTask,
      root.MxWcTemplate,
    );
  }
})(this, function(Log, T, ExtMsg, Asset, Task, Template, undefined) {
  "use strict";

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
   *   - {Array} frames
   *   - {Object} mimeTypeDict
   *   - {Object} config
   */

  async function capture(node, opts) {
    const {parentFrameId, baseUrl, clipId, saveFormat,
      storageInfo, frames, mimeTypeDict, config} = opts;
    const srcdoc = node.getAttribute('srcdoc');
    const src = node.getAttribute('src');

    // in content script, frameNode.contentWindow is undefined.
    // window.frames includes current layer frames.
    //   firefox: all frames
    //   chrome: frames inside body node.

    if (srcdoc || !src) {
      // inline iframe
      // assetName = Asset.getFilenameByContent({content: srcdoc, extension: 'frame.html'});
      // TODO ?
      node.setAttribute('data-mx-warn', 'srcdoc attribute is not capture by maoxian');
      return [];
    }

    const r = T.completeUrl(src, baseUrl);
    const {isValid, url, message} = r;

    if (!isValid) {
      node.outerHTML = `<div data-mx-warn="${message}" data-mx-original-src="${src}"></div>`;
      return [];
    }

    if (T.isExtensionUrl(url)) {
      node.parentNode.removeChild(node);
      return [];
    }

    const frame = frames.find((it) => it.url === url && it.parentFrameId === parentFrameId);
    if (!frame) {
      Log.debug("What happened");
      //TODO
      return [];
    } else if(frame.errorOccurred) {
      // the last navigation in this frame was interrupted by an error
      return [];
    } else {
      // console.log("MatchIframe", frame);
    }

    node.removeAttribute('referrerpolicy');

    const key = [clipId, url].join('.');
    const canAdd = await ExtMsg.sendToBackground({type: 'keyStore.add', body: {key: key}});
    if (canAdd) {

      const msgType = saveFormat === 'html' ? 'frame.toHtml' : 'frame.toMd';
      try {
        const {elemHtml, styleHtml, title, tasks} = await ExtMsg.sendToBackground({
          type: msgType,
          frameId: frame.frameId,
          frameUrl: frame.url,
          body: { clipId, frames, storageInfo,
            mimeTypeDict, config }
        });

        if (saveFormat === 'html') {
          const html = Template.framePage.render({
            originalSrc: frame.url,
            title: (title || ""),
            styleHtml: styleHtml,
            html: elemHtml
          });
          const assetName = Asset.getFilename({ link: frame.url, extension: 'frame.html'});
          const filename = T.joinPath(storageInfo.saveFolder, assetName);
          node.setAttribute('src', assetName);
          const task = Task.createFrameTask(filename, html, clipId);
          tasks.push(task);
          return tasks;
        } else {
          node.outerHTML = `<div>${elemHtml}</div>`;
          return tasks;
        }
      } catch(e) {
        Log.error(e);
        // Frame page failed to load (mainly caused by network problem).
        // ExtMsg.sendToContentFrame resolve undefined.
        // (catched by ExtMsg.sendToTab).
        //
        node.outerHTML = `<div data-mx-warn="Frame page failed to load" data-mx-original-src="${url}"></div>`;
        return [];
      }
    } else {
      // processed
      if (saveFormat === 'html') {
        const assetName = Asset.getFilename({ link: frame.url, extension: 'frame.html'});
        node.setAttribute('src', assetName);
      } else {
        // FIXME
        // Maybe we can cache the message and retrieve it back in here.
        // So we can get the frame html;
      }
      return [];
    }
  }


  return {capture: capture}
});
