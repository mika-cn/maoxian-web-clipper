const H = require('./helper.js');
const DOMTool = H.depJs('lib/dom-tool.js');
const Capturer = H.depJs('capturer/a.js');

function getNode(href) {
  const html = `<a href="${href}" target="_self">Name</a>`;
  const {node} = DOMTool.parseHTML(html);
  return node;
}

describe('Capture A', () => {

  it("Capture A without href attribute", () => {
    const node = getNode('whatever');
    node.removeAttribute('href');
    const docUrl = 'https://a.org/index.html';
    const baseUrl = docUrl;
    Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertTrue(node.hasAttribute('data-mx-warn'));
  });

  function capture(link, expectedValue) {
    it("Capture A: " + link, () => {
      const node = getNode(link);
      const docUrl = 'https://a.org/index.html';
      const baseUrl = docUrl;
      Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
      H.assertEqual(node.getAttribute('href'), expectedValue);
    })
  }
  capture('a/b/c', 'https://a.org/a/b/c');
  capture('#', '#');
  capture('#xxx', '#xxx');
  capture('https://a.org/index.html#xxx', '#xxx');
  capture('javascript:void(0)', 'javascript:void(0)');
  capture('https://a.org/a/b', 'https://a.org/a/b');
  capture('https://:invalid.url', 'https://:invalid.url');

  function captureBase(link, expectedValue) {
    it("Capture A with different baseUrl: " + link, () => {
      const node = getNode(link);
      const docUrl = 'https://a.org/index.html';
      const baseUrl = 'https://b.org/index.html';
      Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
      H.assertEqual(node.getAttribute('href'), expectedValue);
    });
  }
  captureBase('a/b/c', 'https://b.org/a/b/c');
  captureBase('#', 'https://b.org/index.html#');
  captureBase('#xxx', 'https://b.org/index.html#xxx');
  captureBase('https://a.org/index.html#xxx', '#xxx');
  captureBase('https://a.org/a/b', 'https://a.org/a/b');

  it("capture A - other attrs", () => {
    const link = '/b/index.html';
    const node = getNode(link);
    const docUrl = 'https://a.org/index.html';
    const baseUrl = docUrl;
    node.setAttribute('ping', 'https://track.a.org/entry');
    Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertEqual(node.getAttribute('referrerpolicy'), 'no-referrer');
    H.assertEqual(node.getAttribute('rel'), 'noopener noreferrer');
    H.assertEqual(node.getAttribute('target'), '_blank');
    H.assertFalse(node.hasAttribute('ping'));

    const nodeB = getNode('#xxx');
    const originalTarget = nodeB.getAttribute('target');
    nodeB.setAttribute('ping', 'https://track.a.org/entry');
    Capturer.capture(nodeB, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertEqual(nodeB.getAttribute('target'), originalTarget);
    H.assertFalse(node.hasAttribute('ping'));
  });

  it("capture A - not http protocol", () => {
    const docUrl = 'https://a.org/index.html';
    const baseUrl = docUrl;
    function t(href) {
      let node = getNode(href);
      Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
      H.assertEqual(node.getAttribute('href'), href);
    }
    t('mailto:nobody@a.org');
    t('tel:+4912345');
    t('javascript:void(0)');
    t('about:home');
    t('ftp://192.0.0.1/home');
    t('chrome://communicator/skin/');
  });

})
