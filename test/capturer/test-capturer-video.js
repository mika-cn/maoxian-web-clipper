
import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerVideo from '../../src/js/capturer/video.js';
import RequestParams from '../../src/js/lib/request-params.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerVideo);

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
    config: {htmlCaptureVideo: 'saveAll'},
  }
}

describe('Capture Video', () => {
  it('capture video without childNodes', async() => {
    const node = {type: 1, name: 'VIDEO', attr: {src: 'test.mp4', poster: 'test.jpg'}, childNodes: []};
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.change.getAttr('controls'), "");
    H.assertTrue(r.change.deletedAttr('controlslist'));
    H.assertTrue(r.change.deletedAttr('autoplay'));
    H.assertTrue(r.change.deletedAttr('loop'));
    H.assertTrue(r.change.deletedAttr('muted'));
    H.assertTrue(r.change.deletedAttr('crossorigin'));
    H.assertTrue(r.change.deletedAttr('disablepictureinpicture'));
    H.assertTrue(r.change.deletedAttr('autopictureinpicture'));
    H.assertEqual(r.tasks.length, 2);
    H.assertNotEqual(r.change.getAttr('src'), 'test.mp4');
    H.assertNotEqual(r.change.getAttr('poster'), 'test.jpg');

    ExtMsg.clearMocks();
  });

  it('capture video node that has source children and track children', async ()=> {
    const node = {type: 1, name: 'VIDEO', attr: {controls: ''},  childNodes: [
      {type: 1, name: 'SOURCE', attr: {src: 'test.mp4', type: 'video/mp4'}},
      {type: 1, name: 'SOURCE', attr: {src: 'test.webm', type: 'video/webm'}},
      {type: 1, name: 'TRACK', attr: {src: 'test.vtt'}},
    ]};
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 3);
    const [sourceA, sourceB, track] = node.childNodes;
    H.assertNotEqual(sourceA.change.attr.src, 'test.mp4')
    H.assertNotEqual(sourceB.change.attr.src, 'test.webm')
    H.assertNotEqual(track.change.attr.src, 'test.vtt')
    H.assertFalse(r.change.hasAttr('data-mx-warn'));
    ExtMsg.clearMocks();
  });


  it('capture video node that has currentSrc', async ()=> {
    const node = {type: 1, name: 'VIDEO', attr: {src: 'test.flv', controls: ''},  childNodes: [
      {type: 1, name: 'SOURCE', attr: {src: 'test.mp4', type: 'video/mp4'}},
      {type: 1, name: 'SOURCE', attr: {src: 'test.webm', type: 'video/webm'}},
      {type: 1, name: 'TRACK', attr: {src: 'test.vtt'}},
    ]};
    node.currentSrc = 'test.3gp';
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    params.config.htmlCaptureVideo = 'saveCurrent';
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 2);

    const [videoTask, trackTask] = r.tasks;
    H.assertMatch(videoTask.url, /\.3gp/);
    H.assertMatch(trackTask.url, /\.vtt/);

    const [sourceA, sourceB, track] = node.childNodes;
    H.assertTrue(sourceA.change.ignore);
    H.assertTrue(sourceB.change.ignore);
    H.assertEqual(track.name, 'TRACK');
    H.assertNotEqual(track.change.attr.src, 'test.vtt')
    H.assertFalse(r.change.hasAttr('data-mx-warn'));
    ExtMsg.clearMocks();
  });

});
