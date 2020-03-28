const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;
const H = require('./helper.js');
const DOMTool = H.depJs('lib/dom-tool.js');

const stripCssComment = require('strip-css-comments');
const Log         = H.depJs('lib/log.js');
const Tool        = H.depJs('lib/tool.js');
const Asset       = H.depJs('lib/asset.js');
const Task        = H.depJs('lib/task.js');
const CaptureTool = H.depJs('capturer/tool.js');
const ExtMsg      = H.depMockJs('ext-msg.js');

const CapturerCssFactory = H.depJs('capturer/css.js');
const CapturerLinkFactory = H.depJs('capturer/link.js');

function getCapturerCss() {
  return CapturerCssFactory( stripCssComment,
      Log, Tool, Asset, Task, ExtMsg, CaptureTool);
}

function getCapturer() {
  return CapturerLinkFactory( Tool, Asset, Task,
      getCapturerCss(), CaptureTool);
}

function getNode(html) {
  const {doc} = DOMTool.parseHTML(win, html);
  return doc.head.children[0];
}

function getParams() {
  return {
    docUrl: 'https://a.org/index.html',
    baseUrl: 'https://a.org/index.html',
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
    headerParams: {
      refUrl: 'https://a.org/index.html',
      origin: 'https://a.org',
      userAgent: 'ua',
      referrerPolicy: 'origin',
    }
  }
}

describe('Capture link', () => {

  function initTest(html) {
    const text = 'body{font-size:12pt;}';
    ExtMsg.mockFetchTextStatic(text);
    return {
      node: getNode(html),
      params: getParams(),
      Capturer: getCapturer(),
    }
  }

  it('capture link without rel attribute', async () => {
    const html = '<link href="_">';
    const {node, params, Capturer} = initTest(html);
    const {tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
  });

  it('capture link without href attribute', async () => {
    const html = '<link rel="_">';
    const {node, params, Capturer} = initTest(html);
    const {tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
  });

  it('capture link rel="icon"', async() => {
    const html = '<link rel="icon" href="a.icon">';
    const {node, params, Capturer} = initTest(html);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertMatch(r.node.getAttribute('href'), /assets\/[^\.\/]+\.icon/);
  });

  it('capture link rel="shortcut icon"', async() => {
    const html = '<link rel="shortcut icon" href="a.icon">';
    const {node, params, Capturer} = initTest(html);
    const {tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 1);
  });


  it('capture link rel="apple-touch-icon-precomposed"', async() => {
    const html = '<link rel="apple-touch-icon-precomposed" href="a" type="image/png">';
    const {node, params, Capturer} = initTest(html);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertMatch(r.node.getAttribute('href'), /assets\/[^\.\/]+\.png/);
  });

  async function testCaptureStylesheet(html) {
    const {node, params, Capturer} = initTest(html);
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
    const {node, params, Capturer} = initTest(html);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.hasAttribute('data-mx-ignore-me'));
  });


});
