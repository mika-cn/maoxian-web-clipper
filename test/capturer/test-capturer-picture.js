import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import Capturer from '../../src/js/capturer/picture.js';
import RequestParams from '../../src/js/lib/request-params.js';

const ExtMsg = H.depMockJs('ext-msg.js');
ExtMsg.initBrowser(browser);

function getNode() {
  const node = {type: 1, name: 'PICTURE', childNodes: [
    {type: 1, name: 'SOURCE', attr: {srcset: 'a.png 200w, b.png 400w'}},
    {type: 1, name: 'SOURCE', attr: {srcset: 'abc', type: 'image/jpeg'}},
    {type: 1, name: 'SOURCE', attr: {srcset: 'd.png', type: 'image/jpeg'}},
    {type: 1, name: 'IMG', attr: {src: 'img.png', title: 'default image'}},
  ]};
  return node;
}


function getParams() {
  const url = 'https://a.org/index.html';
  return {
    baseUrl: url,
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
      raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
      valueObj: {now: Date.now()},
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
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 4);
    const [sourceA, sourceB, sourceC, img] = node.childNodes;
    H.assertMatch(sourceB.change.attr.srcset, /\.jpg$/);
    H.assertMatch(sourceC.change.attr.srcset, /\.png$/);
    H.assertEqual(img.change, undefined);
    ExtMsg.clearMocks();
  });
});
