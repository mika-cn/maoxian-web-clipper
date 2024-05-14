import H from '../helper.js';
import CapturerA from '../../src/js/capturer-svg/a.js';

const Capturer = H.wrapCapturer(CapturerA);

function getNode(appendAttrs = {}) {
  const node = {type: 1, name: 'A', attr: {target: '_self'}};
  node.attr = Object.assign({}, node.attr, appendAttrs);
  return node;
}

describe('Capture SVG A', () => {
  it("without 'href' or 'xlink:href' attribute", () => {
    const node = getNode();
    const docUrl = 'https://a.org/index.html';
    const baseUrl = docUrl;
    const {change} = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertTrue(change.hasAttr('data-mx-warn'));
  });

  it("can capture deprecated attribute 'xlink:href'", () => {
    const node = getNode({"xlink:href": "test"});
    const docUrl = 'https://a.org/index.html';
    const baseUrl = docUrl;
    const {change} = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertEqual(change.getAttr('xlink:href'), "https://a.org/test");
  });

  it("delete attribute 'xlink:href' when it has 'href'", () => {
    const node = getNode({"href": "test", "xlink:href": "removeme"});
    const docUrl = 'https://a.org/index.html';
    const baseUrl = docUrl;
    const {change} = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertEqual(change.getAttr('href'), "https://a.org/test");
    H.assertTrue(change.deletedAttr('xlink:href'));
  });
});
