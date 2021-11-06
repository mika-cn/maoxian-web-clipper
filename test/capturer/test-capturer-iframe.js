import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerIframe from '../../src/js/capturer/iframe.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerIframe);



describe("Capture iframe", async () => {

  function getParams() {
    return {
      clipId: '001',
      saveFormat: 'html',
      storageInfo: {
        mainFileFolder: 'category-a/clipping-001',
        frameFileFolder: 'category-a/clipping-001',
        raw: { frameFileName: '$TIME-INTSEC-$MD5URL.frame.html' },
        valueObj: {now: Date.now()},
      },
      html: 'HTML-CONTENT',
    }
  }

  it('capture errorMessage', async () => {
    ExtMsg.mockGetUniqueFilename();
    const params = getParams();
    const node = {type: 1, name: 'IFRAME',
      url: 'https://a.org', errorMessage: "ErrMsg"};
    const rA = await Capturer.capture(node, params);
    H.assertEqual(rA.tasks.length, 0);
    H.assertTrue(rA.change.hasAttr('srcdoc'));
    H.assertTrue(rA.change.deletedAttr('src'));

    params.saveFormat = 'md';
    const rB = await Capturer.capture(node, params);
    H.assertEqual(rB.tasks.length, 0);
    H.assertTrue(rB.change.getProperty('ignore'));
    ExtMsg.clearMocks();
  });

  it('capture html', async () => {
    ExtMsg.mockGetUniqueFilename();
    const params = getParams();
    const node = {type: 1, name: 'IFRAME',
      url: 'https://a.org',
      frame: {url: 'https://a.org'},
    };
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.change.hasAttr('src'));
    H.assertTrue(r.change.deletedAttr('srcdoc'));
    H.assertTrue(r.change.deletedAttr('referrerpolicy'));
    ExtMsg.clearMocks();
  });

})
