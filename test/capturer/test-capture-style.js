import browser from 'sinon-chrome';
global.browser = browser;

const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import Capturer from '../../src/js/capturer/style.js';

const ExtMsg = H.depMockJs('ext-msg.js');
ExtMsg.initBrowser(browser);

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
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertFalse(r.node.hasAttribute('nonce'));
  });
});
