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
 * @param {Snapshot} node
 * @param {Object} opts
 * @param {String} opts.baseUrl
 * @param {String} opts.clipId
 * @param {Object} opts.storageInfo
 * @param {Object} opts.config
 * @param {Object} opts.requestParams
 * @param {Object} opts.cssParams
 * @param {Boolean} opts.cssParams.needFixStyle
 * @param {Boolean} opts.cssParams.removeUnusedRules
 * @param {Object}  opts.cssParams.usedFont
 * @param {Object}  opts.cssParams.usedKeyFrames
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
      return await captureIcon({node, href, linkTypes, opts});
    }
  } else {
    if (linkTypes.indexOf('icon') > -1) {
      return await captureIcon({node, href, linkTypes, opts});
    }
  }

  change.setProperty('ignore', true);
  change.setProperty('ignoreReason', 'unsupportedLinkRel');

  return {change, tasks};
}

async function captureIcon({node, href, linkTypes, opts}) {
  //The favicon of the website.
  const {baseUrl, clipId, storageInfo, requestParams, config} = opts;
  const tasks = [];
  const change = new SnapshotNodeChange();

  const removeIcon = (
       config.htmlCaptureIcon == 'remove'
    || config.htmlCaptureIcon == 'saveFavicon' && linkTypes.indexOf('icon') == -1
  );

  if (removeIcon) {
    change.setProperty('ignore', true);
    change.setProperty('ignoreReason', 'removeByUserConfigure');
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



/**
 * We don't save alternative stylesheets. they have a disabled property
 * which value is true, disabled stylesheets won't be svaed.
 */
async function captureStylesheet({node, linkTypes, href, opts}) {
  const {baseUrl, clipId, storageInfo, requestParams, cssParams} = opts;
  const tasks = [];
  const change = new SnapshotNodeChange();

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
      baseUrl: url,
      docBaseUrl: baseUrl,
    }));

  if (T.isBlankStr(r.cssText)) {
    change.setProperty('ignore', true);
    change.setProperty('ignoreReason', 'blank');

  } else {

    const id = (cssParams.removeUnusedRules ? (url + '#' + Asset.md5(r.cssText)) : url);
    const {filename, path} = await Asset.getFilenameAndPath({
      link: url, extension: 'css', id, clipId, storageInfo});

    const cssText = (cssParams.needFixStyle ? CapturerStyleSheet.fixBodyChildrenStyle(r.cssText) : r.cssText);

    tasks.push(...r.tasks);
    tasks.push(Task.createStyleTask(filename, cssText, clipId));

    change.setAttr('href', path);
    handleOtherAttrs(change);
  }
  return {change, tasks};
}

function handleOtherAttrs(change) {
  change.rmAttr('integrity');
  change.rmAttr('crossorigin');
  change.setAttr('referrerpolicy', 'no-referrer');
  return change;
}


export default {capture};
