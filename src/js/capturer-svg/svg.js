
import SnapshotNodeChange from '../snapshot/change.js';

const SVG_NS = "http://www.w3.org/2000/svg"

/**
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 */
function capture(node, params = {}) {
  const tasks = [];
  const change = new SnapshotNodeChange();
  if (node.nestedSvg) {return {change, tasks}}

  if (node.mxAttr && node.mxAttr.saveAsImg) {
    if (!node.attr.hasOwnProperty('xmlns')) {
      change.setAttr('xmlns', SVG_NS);
    }
  }
  return {change, tasks};
}

export default {capture};
