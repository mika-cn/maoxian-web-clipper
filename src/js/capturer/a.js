
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
function capture(node, {baseUrl, docUrl}) {
  const tasks = [];
  const change = new SnapshotNodeChange();

  const href = node.attr.href;
  const {isValid, url, message} = T.completeUrl(href, baseUrl);
  let newHref = href;

  if (isValid) {
    if (url.toLowerCase().startsWith('javascript:')) {
      newHref = 'javascript:';
    } else {
      newHref = T.url2Anchor(url, docUrl);
    }
  } else {
    change.setAttr('data-mx-warn', message);
    return {change, tasks};
  }

  change.setAttr('href', newHref);
  change.rmAttr('ping');

  if (!newHref.match(/^#/)) {
    // not anchor link (fragment link)
    change.setAttr('target', '_blank');
    change.setAttr('referrerpolicy', 'no-referrer');
    change.setAttr('rel', 'noopener noreferrer');
  }
  return {change, tasks};
}

export default {capture};
