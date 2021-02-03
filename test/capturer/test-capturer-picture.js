import browser from 'sinon-chrome';
global.browser = browser;

const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import Capturer from '../../src/js/capturer/picture.js';
import RequestParams from '../../src/js/lib/request-params.js';

const ExtMsg = H.depMockJs('ext-msg.js');
ExtMsg.initBrowser(browser);

function getNode() {
  let html = `
    <picture>
      <source srcset="a.png 200w, b.png 400w">
      <source srcset="abc" type="image/jpeg">
      <source srcset="d.png" type="image/jpeg">
      <img src="img.png" title='default image' >
    </picture>`;
  const {node} = DOMTool.parseHTML(win, html);
  return node;
}


function getParams() {
  const url = 'https://a.org/index.html';
  return {
    baseUrl: url,
    storageInfo: {
      assetFolder: 'category-a/clippings/assets',
      assetRelativePath: 'assets'
    },
    clipId: '001',
    requestParams: RequestParams.createExample({refUrl: url}),
  }
}

describe('Capture Picture', () => {
  it('capture picture source element', async ()=> {
    const params = getParams();
    const node = getNode();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 4);
    const [sourceA, sourceB, sourceC, img] = r.node.children;
    H.assertMatch(sourceB.getAttribute('srcset'), /\.jpg$/);
    H.assertMatch(sourceC.getAttribute('srcset'), /\.png$/);
    H.assertEqual(img.getAttribute('src'), 'img.png');
    ExtMsg.clearMocks();
  });
});
