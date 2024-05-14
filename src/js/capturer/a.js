
import T from '../lib/tool.js';
import SnapshotNodeChange from '../snapshot/change.js';

/*!
 * Capture SnapshotNode A
 */

/**
 * @param {SnapshotNode} node
 * @param {Object} params
 *   - {String} baseUrl
 *   - {String} docUrl
 *
 */
function capture(node, {baseUrl, docUrl, attrName = 'href'}) {
  const tasks = [];
  const change = new SnapshotNodeChange();

  const attrValue = node.attr[attrName];
  const {isValid, url, message} = T.completeUrl(attrValue, baseUrl);
  let newValue = attrValue;

  if (isValid) {
    if (url.toLowerCase().startsWith('javascript:')) {
      newValue = 'javascript:';
    } else {
      newValue = T.url2Anchor(url, docUrl);
    }
  } else {
    change.setAttr('data-mx-warn', message);
    return {change, tasks};
  }

  change.setAttr(attrName, newValue);
  change.rmAttr('ping');

  if (!newValue.match(/^#/)) {
    // not anchor link (fragment link)
    change.setAttr('target', '_blank');
    change.setAttr('referrerpolicy', 'no-referrer');
    change.setAttr('rel', 'noopener noreferrer');
  }
  return {change, tasks};
}

export default {capture};
