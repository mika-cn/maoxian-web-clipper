
import SnapshotNodeChange from '../snapshot/change.js';

/**
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 */
const SVG_NS = "http://www.w3.org/2000/svg"

function capture(node, params = {}) {
  const tasks = [];
  const change = new SnapshotNodeChange();
  if (node.mxAttr && node.mxAttr.saveAsImg) {
    if (!node.attr.hasOwnProperty('xmlns')) {
      change.setAttr('xmlns', SVG_NS);
    }
  }
  return {change, tasks};
}

export default {capture};
