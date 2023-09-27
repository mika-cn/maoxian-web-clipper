
import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerObject from '../../src/js/capturer/object.js';
import RequestParams from '../../src/js/lib/request-params.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerObject);


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
    config: {htmlCaptureObject: 'saveAll'},
  }
}

describe('Capture Object', () => {

  it('capture object with config: "remove"', async() => {
    const node = {type: 1, name: 'OBJECT', childNodes: [], attr: {data: ''}};
    const params = getParams();
    params.config.htmlCaptureObject = 'remove';
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertTrue(r.change.getProperty('ignore'));
  });

  it('capture invalid url', async() => {
    const node = {type: 1, name: 'OBJECT', childNodes: [], attr: {data: ''}};
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertTrue(r.change.getProperty('ignore'));
  });

  it('capture object with config "saveAll"', async() => {
    const node = {type: 1, name: 'OBJECT', childNodes: [], attr: {data: 'a.mp4'}};
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.change.getAttr('data').endsWith('.mp4'));
  });


  it('capture object with config "saveImage" - not match', async() => {
    const node = {type: 1, name: 'OBJECT', childNodes: [], attr: {data: 'a.mp4'}};
    const params = getParams()
    params.config.htmlCaptureObject = 'saveImage';
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.change.getProperty('ignore'));
  });


  it('capture object with config "saveImage" - match', async() => {
    const node = {type: 1, name: 'OBJECT', childNodes: [], attr: {data: 'a.webp'}};
    const params = getParams()
    params.config.htmlCaptureObject = 'saveImage';
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.change.getAttr('data').endsWith('.webp'));
  });

  it('capture object with config "filter" - <images>,pdf', async() => {
    const node = {type: 1, name: 'OBJECT', childNodes: [], attr: {data: 'a.pdf'}};
    const params = getParams()
    params.config.htmlObjectFilter = '<images>,pdf';
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.change.getAttr('data').endsWith('.pdf'));
  });
});
