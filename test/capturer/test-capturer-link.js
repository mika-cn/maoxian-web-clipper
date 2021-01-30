import browser from 'sinon-chrome';
global.browser = browser;

const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import Capturer from '../../src/js/capturer/link.js';
import RequestParams from '../../src/js/lib/request-params.js';

const ExtMsg = H.depMockJs('ext-msg.js');
ExtMsg.initBrowser(browser);


function getNode(html) {
  const {doc} = DOMTool.parseHTML(win, html);
  return doc.head.children[0];
}

function getParams() {
  const url = 'https://a.org/index.html';
  return {
    docUrl: url,
    baseUrl: url,
    storageInfo: {
      assetFolder: 'category-a/clippings/assets',
      assetRelativePath: 'assets'
    },
    clipId: '001',
    config: {
      saveWebFont: false,
      saveCssImage: false,
      saveIcon: true,
    },
    requestParams: RequestParams.createExample({refUrl: url}),
  }
}

describe('Capture link', () => {

  function initTest(html) {
    const text = 'body{font-size:12pt;}';
    ExtMsg.mockFetchTextStatic(text);
    return {
      node: getNode(html),
      params: getParams()
    }
  }

  it('capture link without rel attribute', async () => {
    const html = '<link href="_">';
    const {node, params} = initTest(html);
    const {tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
  });

  it('capture link without href attribute', async () => {
    const html = '<link rel="_">';
    const {node, params} = initTest(html);
    const {tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
  });

  it('capture link rel="icon"', async() => {
    const html = '<link rel="icon" href="a.icon">';
    const {node, params} = initTest(html);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertMatch(r.node.getAttribute('href'), /assets\/[^\.\/]+\.icon/);
  });

  it('capture link rel="shortcut icon"', async() => {
    const html = '<link rel="shortcut icon" href="a.icon">';
    const {node, params} = initTest(html);
    const {tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 1);
  });


  it('capture link rel="apple-touch-icon-precomposed"', async() => {
    const html = '<link rel="apple-touch-icon-precomposed" href="a" type="image/png">';
    const {node, params} = initTest(html);
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertMatch(r.node.getAttribute('href'), /assets\/[^\.\/]+\.png/);
    ExtMsg.clearMocks();
  });

  async function testCaptureStylesheet(html) {
    const {node, params} = initTest(html);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertEqual(r.node.getAttribute('referrerpolicy'), 'no-referrer');
    H.assertMatch(r.node.getAttribute('href'), /assets\/[^\.\/]+\.css/);
    ExtMsg.clearMocks();
  }

  it('capture rel="stylesheet"', async () => {
    const html = '<link rel="stylesheet" href="style-A.css">';
    await testCaptureStylesheet(html);
  });

  it('capture rel="Stylesheet"', async() => {
    const html = '<link rel="Stylesheet" href="style-A.css">';
    await testCaptureStylesheet(html);
  });

  it('capture rel="Stylesheet" that have not extension', async() => {
    const html = '<link rel="Stylesheet" href="style-A">';
    await testCaptureStylesheet(html);
  });

  it('capture rel="alternate stylesheet" disabled', async() => {
    const html = '<link rel="alternate stylesheet" href="style-A.css" disabled>';
    const {node, params} = initTest(html);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.hasAttribute('data-mx-ignore-me'));
  });

  it('should not capture links with rel="preload"', async() => {
    const html = '<link rel="preload" href="style-A.css">';
    const {node, params} = initTest(html);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.hasAttribute('data-mx-ignore-me'));
  });


});
