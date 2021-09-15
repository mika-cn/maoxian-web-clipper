"use strict";

import CapturerStyleSheet from './stylesheet.js';
import SnapshotNodeChange from '../snapshot/change.js';
import {NODE_TYPE} from '../lib/constants.js';

/*!
 * Capture Element <style>
 */

/**
 * @param {Object} params
 *   - {String} baseUrl
 *   - {String} docUrl
 *   - {Object} storageInfo
 *   - {String} clipId
 *   - {Object} config
 *   - {Object} requestParams
 *   - {Boolean} needFixStyle
 *
 */
async function capture(node, params) {
  const change = new SnapshotNodeChange();
  change.rmAttr('nonce');
  if (node.sheet && node.sheet.rules.length > 0) {
    const {needFixStyle} = params;
    const r = await CapturerStyleSheet.captureStyleSheet(node.sheet, Object.assign({ownerType: 'styleNode'}, params));
    const cssText = (needFixStyle ? CapturerStyleSheet.fixBodyChildrenStyle(r.cssText) : r.cssText);

    if (!node.childNodes) { node.childNodes = [] }
    if (node.childNodes.length == 0) {
      node.childNodes.push({
        type: NODE_TYPE.TEXT,
        name: '#text',
        text: cssText
      });
    } else {
      node.childNodes[0].text = cssText;
    }
    return {change, tasks: r.tasks};
  } else {
    return {change, tasks: []};
  }
}

export default {capture};
