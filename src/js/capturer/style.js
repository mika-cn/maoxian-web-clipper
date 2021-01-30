"use strict";

import CapturerCss from './css.js';

/*!
 * Capture Element <style>
 */

/**
 * @param {Object} opts
 *   - {String} baseUrl
 *   - {String} docUrl
 *   - {Object} storageInfo
 *   - {String} clipId
 *   - {Object} cssRulesDict
 *   - {Object} config
 *   - {Object} requestParams
 *   - {Boolean} needFixStyle
 *
 */
async function capture(node, opts) {
  node.removeAttribute('nonce');
  let text = '';
  if (node.getAttribute('data-mx-marker') === 'css-rules') {
    const cssRules = opts.cssRulesDict[node.getAttribute('data-mx-id')];
    const cssText = [].map.call(cssRules, (it) => {
      return it.cssText
    }).join("\n");
    text = `\n${cssText}\n`;
    node.removeAttribute('data-mx-marker');
    node.removeAttribute('data-mx-id');
  } else {
    text = node.textContent;
  }
  const {cssText, tasks} = await CapturerCss.captureText(Object.assign({ text: text }, opts));
  node.textContent = cssText;
  return {node, tasks};
}

export default {capture};
