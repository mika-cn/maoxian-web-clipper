import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerImg from '../../src/js/capturer/img.js';
import RequestParams from '../../src/js/lib/request-params.js';

const ExtMsg = H.depMockJs('ext-msg.js');
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerImg);

function getNode(src, srcset) {
  const node = {type: 1, name: 'IMG', attr: {
    crossorigin: 'anonymous'
  }};
  if (src !== undefined) { node.attr.src = src; }
  if (srcset) { node.attr.srcset = srcset; }
  return node;
}

function getParams() {
  const url = 'https://a.org/index.html';
  return {
    src: 'a.jpg',
    srcset: 'a.png 200w, b.png  400w',
    saveFormat: 'html',
    baseUrl: url,
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
      assetRelativePath: 'assets',
      raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
      valueObj: {now: Date.now()},
    },
    clipId: '001',
    requestParams: RequestParams.createExample({refUrl: url}),
  }
}

describe('Capture Img', () => {

  it('capture empty src', async () => {
    const params = getParams();
    let r = await Capturer.capture(getNode(''), params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.change.getAttr('data-mx-warn').length > 0);
    H.assertTrue(r.change.hasAttr('data-mx-original-src'));

    r = await Capturer.capture(getNode(), params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.change.hasAttr('data-mx-warn'));
    H.assertTrue(r.change.hasAttr('data-mx-original-src'));
  });

  it('capture img src', async () => {
    const params = getParams();
    const {src, storageInfo} = params;
    const node = getNode(src);
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertMatch(r.change.getAttr('src'), /^assets\/\d+-[^\/]+\.jpg/);
    H.assertTrue(r.tasks[0].filename.startsWith(storageInfo.assetFolder));
    H.assertEqual(r.change.getAttr('srcset'), undefined);
    H.assertTrue(r.change.deletedAttr('crossorigin'));
    ExtMsg.clearMocks();
  });

  it('capture img srcset', async () => {
    const params = getParams();
    const {src, srcset} = params;
    const node = getNode(src, srcset);
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 3);
    const srcsetItems = r.change.getAttr('srcset').split(',');
    H.assertMatch(srcsetItems[0], /^assets\/[^\/]+.png 200w$/);
    H.assertMatch(srcsetItems[1], /^assets\/[^\/]+.png 400w$/);
    ExtMsg.clearMocks();
  });

  it('capture img srcset [markdown]', async () => {
    const params = getParams();
    const {src, srcset} = params;
    const node = getNode(src, srcset);
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, Object.assign({}, params, {saveFormat: 'md'}));
    H.assertEqual(r.tasks.length, 1);
    ExtMsg.clearMocks();
  })

});
