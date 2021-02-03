"use strict";

import T           from '../lib/tool.js';
import Asset       from '../lib/asset.js';
import Task        from '../lib/task.js';
import CapturerCss from './css.js';

/*!
 * Capture Element <link>
 */

/**
 * @param {Object} opts
 *   - {String} baseUrl
 *   - {String} docUrl
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {Object} config
 *   - {Object} requestParams
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

  if (linkTypes.indexOf('preload') > -1) {
    node.setAttribute('data-mx-ignore-me', 'true');
    return {node, tasks};
  }

  if (linkTypes.indexOf('stylesheet') > -1) {
    return await captureStylesheet({node, linkTypes, href, opts});
  } else if (linkTypes.length === 1) {
    const [linkType] = linkTypes;
    if (linkType.match(/icon/)) {
      return await captureIcon({node, href, opts});
    }
  } else {
    if (linkTypes.indexOf('icon') > -1) {
      return await captureIcon({node, href, opts});
    }
  }

  return {node, tasks};
}

async function captureIcon({node, href, opts}) {
  //The favicon of the website.
  const {baseUrl, docUrl, clipId, storageInfo, requestParams, config} = opts;
  const tasks = [];

  if (!config.saveIcon) {
    node.setAttribute('data-mx-ignore-me', 'true');
    return {node, tasks};
  }

  const {isValid, url, message} = T.completeUrl(href, baseUrl);
  if (isValid) {
    const httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));
    const mimeTypeData = {
      httpMimeType: httpMimeType,
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
  const {baseUrl, docUrl, clipId, storageInfo, config} = opts;

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


export default {capture};
