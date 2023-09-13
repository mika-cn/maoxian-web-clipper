
import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerEmbed from '../../src/js/capturer/embed.js';
import RequestParams from '../../src/js/lib/request-params.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerEmbed);


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
    config: {htmlCaptureEmbed: 'saveAll'},
  }
}

describe('Capture Embed', () => {

  it('capture embed with config: "remove"', async() => {
    const node = {type: 1, name: 'EMBED', childNodes: [], attr: {src: ''}};
    const params = getParams();
    params.config.htmlCaptureEmbed = 'remove';
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertTrue(r.change.getProperty('ignore'));
  });

  it('capture invalid url', async() => {
    const node = {type: 1, name: 'EMBED', childNodes: [], attr: {src: ''}};
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertTrue(r.change.getProperty('ignore'));
  });

  it('capture embed with config "saveAll"', async() => {
    const node = {type: 1, name: 'EMBED', childNodes: [], attr: {src: 'a.mp4'}};
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.change.getAttr('src').endsWith('.mp4'));
  });


  it('capture embed with config "saveImage" - not match', async() => {
    const node = {type: 1, name: 'EMBED', childNodes: [], attr: {src: 'a.mp4'}};
    const params = getParams()
    params.config.htmlCaptureEmbed = 'saveImage';
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.change.getProperty('ignore'));
  });


  it('capture embed with config "saveImage" - match', async() => {
    const node = {type: 1, name: 'EMBED', childNodes: [], attr: {src: 'a.webp'}};
    const params = getParams()
    params.config.htmlCaptureEmbed = 'saveImage';
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.change.getAttr('src').endsWith('.webp'));
  });
});
