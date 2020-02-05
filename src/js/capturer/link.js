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
   *   - {Object} headerParams
   *
   */
  async function capture(node, opts) {

    const rel = node.getAttribute('rel')
    const href = node.getAttribute('href');
    const tasks = [];
    const {config} = opts;

    if (!rel) {
      // "rel" is absent, or empty
      // This node does not create any links.
      return {node, tasks};
    }

    if(!href) {
      // "href" is absent, or empty
      // This node does not create any links.
      return {node, tasks};
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
    } else {
      if (linkTypes.indexOf('icon') > -1) {
        return captureIcon({node, href, opts});
      }
    }

    return {node, tasks};
  }

  function captureIcon({node, href, opts}) {
    //The favicon of the website.
    const {baseUrl, docUrl, clipId, storageInfo, mimeTypeDict = {}, config} = opts;
    const tasks = [];

    if (!config.saveIcon) {
      node.setAttribute('data-mx-ignore-me', 'true');
      return {node, tasks};
    }

    const {isValid, url, message} = T.completeUrl(href, baseUrl);
    if (isValid) {
      const mimeTypeData = {
        httpMimeType: mimeTypeDict[url],
        attrMimeType: node.getAttribute('type')
      };
      const {filename, path} = Asset.calcInfo(
        url, storageInfo, mimeTypeData, clipId);
      tasks.push(Task.createImageTask(filename, url, clipId));
      node.setAttribute('href', path);
      node = handleOtherAttrs(node);
      return {node, tasks};
    } else {
      node.setAttribute('data-mx-warn', message);
      return {node, tasks};
    }
  }

  async function captureStylesheet({node, linkTypes, href, opts}) {
    const {baseUrl, docUrl, clipId, storageInfo, mimeTypeDict = {}, config} = opts;

    /*
     * TODO Shall we handle alternative style sheets?
     * <link href="default.css" rel="stylesheet" title="Default Style">
     * <link href="fancy.css" rel="alternate stylesheet" title="Fancy">
     * <link href="basic.css" rel="alternate stylesheet" title="Basic">
     *
     */

    if (node.hasAttribute('disabled')) {
      node.setAttribute('data-mx-ignore-me', 'true');
      return {node: node, tasks: []};
    } else {
      const {isValid, url, message} = T.completeUrl(href, baseUrl);
      if (isValid) {
        const assetName = Asset.getNameByLink({
          link: url,
          extension: 'css',
          prefix: clipId
        });
        const path = Asset.getPath({storageInfo, assetName});
        const tasks = await CapturerCss.captureLink(Object.assign({
          link: url, }, opts));
        node.setAttribute('href', path);
        node = handleOtherAttrs(node);
        return {node: node, tasks: tasks};
      } else {
        node.setAttribute('data-mx-warn', message);
        return {node: node, tasks: []};
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
