"use strict";

import T           from '../lib/tool.js';
import Asset       from '../lib/asset.js';
import Task        from '../lib/task.js';
import CapturerStyleSheet from './stylesheet.js';
import SnapshotNodeChange from '../snapshot/change.js';

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
 *   - {Boolean} needFixStyle
 *
 */
async function capture(node, opts) {
  const tasks = [];
  const change = new SnapshotNodeChange();

  if (!node.attr.rel) {
    // "rel" is absent, or empty
    // This node does not create any links.
    change.setProperty('ignore', true);
    change.setProperty('ignoreReason', 'invalidRel');
    return {change, tasks};
  }

  if(!node.attr.href) {
    // "href" is absent, or empty
    // This node does not create any links.
    change.setProperty('ignore', true);
    change.setProperty('ignoreReason', 'invalidHref');
    return {change, tasks};
  }

  const rel = node.attr.rel
  const href = node.attr.href;
  const {config} = opts;
  const linkTypes = node.relList;

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

  change.setProperty('ignore', true);
  change.setProperty('ignoreReason', 'unsupportedLinkRel');

  return {change, tasks};
}

async function captureIcon({node, href, opts}) {
  //The favicon of the website.
  const {baseUrl, docUrl, clipId, storageInfo, requestParams, config} = opts;
  const tasks = [];
  const change = new SnapshotNodeChange();

  if (config.htmlCaptureIcon == 'remove') {
    change.setProperty('ignore', true);
    change.setProperty('ignoreReason', 'configureItemDisabled');
    return {change, tasks};
  }

  const {isValid, url, message} = T.completeUrl(href, baseUrl);
  if (!isValid) {
    change.setProperty('ignore', true);
    change.setProperty('ignoreReason', 'InvalidHref');
    return {change, tasks};
  }

  const httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));
  const attrMimeType = node.attr.type;
  const {filename, path} = await Asset.getFilenameAndPath({
    link: url, mimeTypeData: {httpMimeType, attrMimeType},
    clipId,  storageInfo,
  });

  tasks.push(Task.createImageTask(filename, url, clipId, requestParams));
  change.setAttr('href', path);
  handleOtherAttrs(change);
  return {change, tasks};
}

async function captureStylesheet({node, linkTypes, href, opts}) {
  const {baseUrl, docUrl, clipId, storageInfo, requestParams, needFixStyle} = opts;
  const tasks = [];
  const change = new SnapshotNodeChange();

  /*
   * TODO Shall we handle alternative style sheets?
   * <link href="default.css" rel="stylesheet" title="Default Style">
   * <link href="fancy.css" rel="alternate stylesheet" title="Fancy">
   * <link href="basic.css" rel="alternate stylesheet" title="Basic">
   *
   */

  if (!node.sheet) {
    change.setProperty('ignore', true);
    change.setProperty('ignoreReason', 'NoSheet');
    return {change, tasks};
  }

  if (node.sheet.disabled) {
    change.setProperty('ignore', true);
    change.setProperty('ignoreReason', 'Disabled');
    return {change, tasks};
  }

  const {isValid, url, message} = T.completeUrl(href, baseUrl);
  if (!isValid) {
    change.setProperty('ignore', true);
    change.setProperty('ignoreReason', 'InvalidHref');
    change.setAttr('data-mx-warn', message);
  }

  const r = await CapturerStyleSheet.captureStyleSheet(
    node.sheet, Object.assign({ownerType: 'linkNode'}, opts, {
      baseUrl: url
    }));

  const {filename, path} = await Asset.getFilenameAndPath({
    link: url, extension: 'css', clipId, storageInfo});

  const cssText = (needFixStyle ? CapturerStyleSheet.fixBodyChildrenStyle(r.cssText) : r.cssText);

  tasks.push(...r.tasks);
  tasks.push(Task.createStyleTask(filename, cssText, clipId));

  change.setAttr('href', path);
  handleOtherAttrs(change);
  return {change, tasks};
}

function handleOtherAttrs(change) {
  change.rmAttr('integrity');
  change.rmAttr('crossorigin');
  change.setAttr('referrerpolicy', 'no-referrer');
  return change;
}


export default {capture};
