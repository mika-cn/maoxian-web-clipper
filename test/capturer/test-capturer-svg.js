import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerSvg from '../../src/js/capturer/svg.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerSvg);

const SVG_XML =
`<svg width="250" height="250" xmlns="http:g/www.w3.org/2000/svg">
 <g>
    <path transform="rotate(30, 216.98, 38.5382)" id="svg_10" d="m176.98002,83.03817l40.00001,-89l40.00001,89l-80.00002,0z" stroke="#000" fill="#111111">
   </g>
</svg>`;

function getNode(attr = {}, mxAttr = {}) {
  const node = {type: 1, name: 'SVG', attr, mxAttr, xml: SVG_XML};
  return node;
}

function getParams() {
  return {
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
      raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
      valueObj: {now: Date.now()},
    },
    clipId: '001',
  }
}

describe('Capture Svg', () => {
  it('should not capture svg without marked attribute', async () => {
    const params = getParams();
    const node = getNode();
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    ExtMsg.clearMocks();
  });

  it('should capture svg with marked attribute', async () => {
    const params = getParams();
    const node = getNode({"deleteme": '1'}, {saveAsImg: true});
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertEqual(r.change.getProperty('name'), 'IMG');
    H.assertTrue(r.change.deletedAttr('deleteme'));
    H.assertTrue(r.change.hasAttr('src'));
    ExtMsg.clearMocks();
  });
});
