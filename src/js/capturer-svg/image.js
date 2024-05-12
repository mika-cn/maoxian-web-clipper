import T           from '../lib/tool.js';
import Asset       from '../lib/asset.js';
import Task        from '../lib/task.js';
import CaptureTool from '../capturer/tool.js';
import SnapshotNodeChange from '../snapshot/change.js';

// href and xlink:href Deprecated : Points at a URL for the image file.

const ATTR_PARAMS_OLD = {resourceType: 'image', attrName: 'xlink:href'}
const ATTR_PARAMS_NEW = {resourceType: 'image', attrName: 'href'}

async function capture(node, params) {
  const {saveFormat, baseUrl, clipId, storageInfo, requestParams, config} = params;
  const tasks = [];
  let change = new SnapshotNodeChange();
  change.rmAttr('crossorigin');

  let r;
  if (node.attr.hasOwnProperty('href')) {
    r = await CaptureTool.captureAttrResource(node, params, ATTR_PARAMS_NEW);
    change.rmAttr('xlink:href');
  } else if (node.attr.hasOwnProperty('xlink:href')) {
    r = await CaptureTool.captureAttrResource(node, params, ATTR_PARAMS_OLD);
  }

  if (r) {
    tasks.push(...r.tasks);
    change = change.merge(r.change);
  } else {
    change.setAttr('data-mx-warn', 'href not provided');
  }

  return {change, tasks};
}

export default {capture}
