import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerCanvas from '../../src/js/capturer/canvas.js';
import RequestParams from '../../src/js/lib/request-params.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerCanvas);


function getParams() {
  const url = 'https://a.org/index.html';
  return {
    saveFormat: 'html',
    clipId: '001',
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
      raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
      valueObj: {now: Date.now()},
    },
    requestParams: RequestParams.createExample({refUrl: url}),
  }
}

describe('Capture Canvas', () => {

  it("Capturer Canvas: tained canvas", async () => {
    const node = {type: 1, name: 'CANVAS'};
    const params = getParams();
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    ExtMsg.clearMocks();
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.change.hasAttr('data-mx-ignore-me'));
  });

  it("Capturer Canvas: with dataUrl", async () => {
    const node = {type: 1, name: 'CANVAS',
      dataUrl: "data:image/png;base64,imagedata"
    };
    const params = getParams();
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    ExtMsg.clearMocks();
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.change.hasStyleProperty('background-image'));
  })

  it("Capturer Canvas: with dataUrl [md]", async () => {
    const node = {type: 1, name: 'CANVAS',
      dataUrl: "data:image/png;base64,imagedata"
    };
    const params = getParams();
    params.saveFormat = 'md';
    ExtMsg.mockGetUniqueFilename();
    const {change, tasks} = await Capturer.capture(node, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 1);
    H.assertEqual(change.getProperty('name'), 'IMG');
    H.assertMatch(change.getAttr('src'), /^assets\//);
  })

});
