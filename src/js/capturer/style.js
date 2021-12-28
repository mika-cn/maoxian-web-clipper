"use strict";

import T                  from '../lib/tool.js';
import {NODE_TYPE}        from '../lib/constants.js';
import CapturerStyleSheet from './stylesheet.js';
import SnapshotNodeChange from '../snapshot/change.js';

/*!
 * Capture Element <style>
 */

/**
 * @param {Snapshot} node
 * @param {Object} params
 * @param {String} params.baseUrl
 * @param {String} params.clipId
 * @param {Object} params.storageInfo
 * @param {Object} params.config
 * @param {Object} params.requestParams
 * @param {Object} params.cssParams
 * @param {Boolean} params.cssParams.needFixStyle
 * @param {Boolean} params.cssParams.removeUnusedRules
 * @param {Object}  params.cssParams.usedFont
 * @param {Object}  params.cssParams.usedKeyFrames
 *
 */
async function capture(node, params) {
  const change = new SnapshotNodeChange();
  change.rmAttr('nonce');

  if (node.sheet && node.sheet.rules.length > 0) {
    const r = await CapturerStyleSheet.captureStyleSheet(node.sheet, Object.assign({ownerType: 'styleNode', docBaseUrl: params.baseUrl}, params));


    if (T.isBlankStr(r.cssText)) {
      change.setProperty('ignore', true);
      change.setProperty('ignoreReason', 'blank');

    } else {

      const {cssParams} = params;
      const cssText = (cssParams.needFixStyle ? CapturerStyleSheet.fixBodyChildrenStyle(r.cssText) : r.cssText);

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
    }
    return {change, tasks: r.tasks};
  } else {
    return {change, tasks: []};
  }
}

export default {capture};
