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
const CapturerStyleFactory = H.depJs('capturer/style.js');

function getCapturerCss() {
  return CapturerCssFactory( stripCssComment,
      Log, Tool, Asset, Task, ExtMsg, CaptureTool);
}

function getCapturer() {
  return CapturerStyleFactory(getCapturerCss());
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
      saveCssImage: false
    }
  }
}

describe('Capture style', () => {
  it("remove nonce", async () => {
    const html = '<style nonce="Axbstebsder">body{background: red;}</style>';
    const {doc} = DOMTool.parseHTML(win, html);
    const node = doc.head.children[0];
    const params = getParams();
    const Capturer = getCapturer();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertFalse(r.node.hasAttribute('nonce'));
  });
});
