
import H from '../helper.js';
import CapturerA from '../../src/js/capturer/a.js';

const Capturer = H.wrapCapturer(CapturerA);

function getNode(href, appendAttrs = {}) {
  const node = {type: 1, name: 'A', attr: {target: '_self'}};
  if (href) { node.attr.href = href }
  node.attr = Object.assign({}, node.attr, appendAttrs);
  return node;
}

describe('Capture A', () => {

  it("Capture A without href attribute", () => {
    const node = getNode();
    const docUrl = 'https://a.org/index.html';
    const baseUrl = docUrl;
    const {change} = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertTrue(change.hasAttr('data-mx-warn'));
  });

  function captureLink(link, expectedValue) {
    it("Capture A: " + link, () => {
      const node = getNode(link);
      const docUrl = 'https://a.org/index.html';
      const baseUrl = docUrl;
      const {change} = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
      H.assertEqual(change.getAttr('href') || node.attr.href, (expectedValue || link));
    })
  }

  captureLink('a/b/c', 'https://a.org/a/b/c');
  captureLink('#', '#');
  captureLink('#xxx', '#xxx');
  captureLink('https://a.org/index.html#xxx', '#xxx');
  captureLink('https://a.org/a/b', 'https://a.org/a/b');
  captureLink('https://:invalid.url', 'https://:invalid.url');

  captureLink('mailto:nobody@a.org');
  captureLink('tel:+4912345');
  captureLink('javascript:void(0)', 'javascript:');
  captureLink('javascript:submit(this)', 'javascript:');
  captureLink('about:home');
  captureLink('ftp://192.0.0.1/home');
  captureLink('chrome://communicator/skin/');

  function captureBase(link, expectedValue) {
    it("Capture A with different baseUrl: " + link, () => {
      const node = getNode(link);
      const docUrl = 'https://a.org/index.html';
      const baseUrl = 'https://b.org/index.html';
      const {change} = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
      H.assertEqual(change.getAttr('href'), expectedValue);
    });
  }
  captureBase('a/b/c', 'https://b.org/a/b/c');
  captureBase('#', 'https://b.org/index.html#');
  captureBase('#xxx', 'https://b.org/index.html#xxx');
  captureBase('https://a.org/index.html#xxx', '#xxx');
  captureBase('https://a.org/a/b', 'https://a.org/a/b');

  it("capture A - other attrs", () => {
    const link = '/b/index.html';
    const node = getNode(link, {
      ping: 'https://track.a.org/entry'
    });

    const docUrl = 'https://a.org/index.html';
    const baseUrl = docUrl;
    const rA = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertEqual(rA.change.getAttr('referrerpolicy'), 'no-referrer');
    H.assertEqual(rA.change.getAttr('rel'), 'noopener noreferrer');
    H.assertEqual(rA.change.getAttr('target'), '_blank');
    H.assertTrue(rA.change.deletedAttr('ping'));

    const nodeB = getNode('#xxx', {
      ping: 'https://track.a.org/entry'
    });
    const rB = Capturer.capture(nodeB, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertEqual(rB.change.getAttr('target'), undefined);
    H.assertTrue(rB.change.deletedAttr('ping'));
  });


})
