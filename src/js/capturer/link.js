;(function (root, factory) {
   if (typeof module === 'object' && module.exports) {
    // CJS
    const process = require('process');
    if (process.env.MX_WC_TESTING) {
      module.exports = factory;
    } else {
      module.exports = factory(
        require('../lib/tool.js'),
        require('../lib/asset.js'),
        require('../lib/task.js'),
        require('./css.js'),
        require('./tool.js')
      );
    }
  } else {
    // browser or other
    root.MxWcCapturerLink = factory(
      root.MxWcTool,
      root.MxWcAsset,
      root.MxWcTask,
      root.MxWcCapturerCss,
      root.MxWcCaptureTool
    );
  }
})(this, function(T, Asset, Task, CapturerCss, undefined) {
  "use strict";

  /*!
   * Capture Element <link>
   */

  /**
   * @param {Object} opts
   *   - {String} baseUrl
   *   - {String} docUrl
   *   - {String} clipId
   *   - {Object} storageInfo
   *   - {Object} mimeTypeDict
   *   - {Object} config
   *   - {Object} headers
   *
   */
  async function capture(node, opts) {

    const rel = node.getAttribute('rel')
    const href = node.getAttribute('href');

    if (!rel) {
      // "rel" is absent, or empty
      // This node does not create any links.
      return [];
    }

    if(!href) {
      // "href" is absent, or empty
      // This node does not create any links.
      return [];
    }

    // Link types are case-insensitive.
    const linkTypes = rel.toLowerCase().split(/\s+/);

    if (linkTypes.indexOf('stylesheet') > -1) {
      return await captureStylesheet({node, linkTypes, href, opts});
    } else if (linkTypes.length === 1) {
      const [linkType] = linkTypes;
      if (linkType.match(/icon/)) {
        return captureIcon({node, href, opts});
      }
    } else if (linkType === 'preload') {
      // remove node?
      // node.parentNode.removeChild(node);
    }

    return [];
  }

  function captureIcon({node, href, opts}) {
    //The favicon of the website.
    const {baseUrl, docUrl, clipId, storageInfo, mimeTypeDict = {}, config, headers} = opts;
    const {isValid, url, message} = T.completeUrl(href, baseUrl);
    if (isValid) {
      let mimeType = node.getAttribute('type');
      if (!mimeType) { mimeType = mimeTypeDict[url] }
      const {filename, url: assetPath} = Asset.calcInfo(
        url, storageInfo, mimeType, clipId);
      const task = Task.createImageTask(filename, url, clipId);
      node.setAttribute('href', assetPath);
      node = handleOtherAttrs(node);
      return [task];
    } else {
      node.setAttribute('data-mx-warn', message);
      return [];
    }
  }

  async function captureStylesheet({node, linkTypes, href, opts}) {
    const {baseUrl, docUrl, clipId, storageInfo, mimeTypeDict = {}, config, headers} = opts;

    /*
     * TODO Shall we handle alternative style sheets?
     * <link href="default.css" rel="stylesheet" title="Default Style">
     * <link href="fancy.css" rel="alternate stylesheet" title="Fancy">
     * <link href="basic.css" rel="alternate stylesheet" title="Basic">
     *
     */

    if (node.hasAttribute('disabled')) {
      // style disabled
      node.parentNode.removeChild(node);
      return [];
    } else {
      const {isValid, url, message} = T.completeUrl(href, baseUrl);
      if (isValid) {
        const {filename, url: assetPath} = Asset.calcInfo(
          url, storageInfo, mimeTypeDict[url], clipId);
        const tasks = await CapturerCss.captureLink(Object.assign({
          link: url, }, opts));
        node.setAttribute('href', assetPath);
        node = handleOtherAttrs(node);
        return tasks;
      } else {
        node.setAttribute('data-mx-warn', message);
        return [];
      }
    }
  }

  function handleOtherAttrs(node) {
    node.removeAttribute('integrity');
    node.removeAttribute('crossorigin');
    node.setAttribute('referrerpolicy', 'no-referrer');
    return node;
  }


  return {capture: capture}
});
