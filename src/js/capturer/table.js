
import {NODE_TYPE} from '../lib/constants.js';
import SnapshotNodeChange from '../snapshot/change.js';


/**
 *
 * @param {SnapshotNode} node
 * @param {Object} params
 * @param {String} params.saveFormat
 *
 * @returns {Object} result
 *
 */

function capture(node, params) {
  const {saveFormat} = params;
  const tasks = [];
  let change = new SnapshotNodeChange();

  if (saveFormat === 'md' && node.rowSize == 0) {
    // empty table
    change.setProperty('ignore', true);
  }

  return {change, tasks};
}

export default {capture};
