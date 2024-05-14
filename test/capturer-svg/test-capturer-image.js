import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerImage from '../../src/js/capturer-svg/image.js';
import RequestParams from '../../src/js/lib/request-params.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerImage);


function getNode(appendAttrs = {}) {
  const node = {type: 1, name: 'IMAGE', attr: {
    crossorigin: 'anonymous'
  }};
  node.attr = Object.assign({}, node.attr, appendAttrs);
  return node;
}


function getParams() {
  const url = 'https://a.org/index.html';
  return {
    saveFormat: 'html',
    baseUrl: url,
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
      raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
      valueObj: {now: Date.now()},
    },
    clipId: '001',
    requestParams: RequestParams.createExample({refUrl: url}),
    config: {htmlCaptureImage: 'saveAll'},
  }
}


describe('Capture SVG Image', () => {

  it('capture not href attribute at all', async () => {
    const node = getNode();
    const params = getParams();
    let r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.change.getAttr('data-mx-warn').length > 0);
  });

  it('capture "xlink:href" attribute', async () => {
    const node = getNode({'xlink:href' : 'a.jpg'});
    const params = getParams();
    ExtMsg.mockGetUniqueFilename();
    let r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.change.hasAttr('xlink:href'));
    H.assertTrue(r.change.deletedAttr('crossorigin'));
    ExtMsg.clearMocks();
  });

  it('capture "href" attribute', async () => {
    const node = getNode({href: 'a.png', 'xlink:href' : 'b.jpg'});
    const params = getParams();
    ExtMsg.mockGetUniqueFilename();
    let r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.change.hasAttr('href'));
    H.assertTrue(r.change.deletedAttr('crossorigin'));
    H.assertTrue(r.change.deletedAttr('xlink:href'));
    ExtMsg.clearMocks();
  });



});
