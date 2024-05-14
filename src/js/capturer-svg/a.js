import CapturerA from '../capturer/a.js';
import SnapshotNodeChange from '../snapshot/change.js';

function capture(node, {baseUrl, docUrl}) {
  if (node.attr.hasOwnProperty('href')) {
    const r = CapturerA.capture(node, {
      baseUrl, docUrl, attrName: 'href'});
    r.change.rmAttr('xlink:href');
    return r;
  }

  if (node.attr.hasOwnProperty('xlink:href')) {
    const r = CapturerA.capture(node, {
      baseUrl, docUrl, attrName: 'xlink:href'});
    return r;
  }

  const change = new SnapshotNodeChange();
  change.setAttr('data-mx-warn', 'not href provided');
  return {change, tasks: []};
}

export default {capture}
