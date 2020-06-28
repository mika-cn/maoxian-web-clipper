const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import Capturer from '../../src/js/capturer/a.js';

function getNode(href) {
  const html = `<a href="${href}" target="_self">Name</a>`;
  const {node} = DOMTool.parseHTML(win, html);
  return node;
}

describe('Capture A', () => {

  it("Capture A without href attribute", () => {
    const node = getNode('whatever');
    node.removeAttribute('href');
    const docUrl = 'https://a.org/index.html';
    const baseUrl = docUrl;
    const r = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertTrue(r.node.hasAttribute('data-mx-warn'));
  });

  function capture(link, expectedValue) {
    it("Capture A: " + link, () => {
      const node = getNode(link);
      const docUrl = 'https://a.org/index.html';
      const baseUrl = docUrl;
      const r = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
      H.assertEqual(r.node.getAttribute('href'), (expectedValue || link));
    })
  }

  capture('a/b/c', 'https://a.org/a/b/c');
  capture('#', '#');
  capture('#xxx', '#xxx');
  capture('https://a.org/index.html#xxx', '#xxx');
  capture('https://a.org/a/b', 'https://a.org/a/b');
  capture('https://:invalid.url', 'https://:invalid.url');

  capture('mailto:nobody@a.org');
  capture('tel:+4912345');
  capture('javascript:void(0)', 'javascript:');
  capture('javascript:submit(this)', 'javascript:');
  capture('about:home');
  capture('ftp://192.0.0.1/home');
  capture('chrome://communicator/skin/');

  function captureBase(link, expectedValue) {
    it("Capture A with different baseUrl: " + link, () => {
      const node = getNode(link);
      const docUrl = 'https://a.org/index.html';
      const baseUrl = 'https://b.org/index.html';
      const r = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
      H.assertEqual(r.node.getAttribute('href'), expectedValue);
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
    let r = Capturer.capture(node, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertEqual(r.node.getAttribute('referrerpolicy'), 'no-referrer');
    H.assertEqual(r.node.getAttribute('rel'), 'noopener noreferrer');
    H.assertEqual(r.node.getAttribute('target'), '_blank');
    H.assertFalse(r.node.hasAttribute('ping'));

    const nodeB = getNode('#xxx');
    const originalTarget = nodeB.getAttribute('target');
    nodeB.setAttribute('ping', 'https://track.a.org/entry');
    r = Capturer.capture(nodeB, {baseUrl: baseUrl, docUrl: docUrl});
    H.assertEqual(r.node.getAttribute('target'), originalTarget);
    H.assertFalse(r.node.hasAttribute('ping'));
  });


})
