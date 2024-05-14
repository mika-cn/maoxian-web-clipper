import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerMxSvgImg from '../../src/js/capturer-svg/mx-svg-img.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerMxSvgImg);


function getNode() {
  const node = {type: 1, name: 'MX-SVG-IMG', attr: {}};
  return node;
}

function getParams() {
  return {
    clipId: '001',
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
      raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
      valueObj: {now: Date.now()},
    },
    xml: 'XML-CONTENT',
  }
}

describe('Capture mx-svg-img', () => {

  it('should save xml as svg image', async () => {
    const node = getNode()
    const params = getParams();
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertMatch(r.change.getProperty('html'), /^\<img/);
    ExtMsg.clearMocks();
  });

});
