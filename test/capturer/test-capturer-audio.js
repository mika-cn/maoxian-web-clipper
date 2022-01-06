import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerAudio from '../../src/js/capturer/audio.js';
import RequestParams from '../../src/js/lib/request-params.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
const Capturer = H.wrapAsyncCapturer(CapturerAudio);

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
    config: {htmlCaptureAudio: 'saveAll'},
  }
}



describe('Capture Audio', () => {

  it('capture audio node that without childNodes', async() => {
    const node = {type: 1, name: 'AUDIO', attr: {src: 'test.mp3'},  childNodes: []};
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertEqual(r.change.getAttr('controls'), "");
    H.assertTrue(r.change.deletedAttr('autoplay'));
    H.assertTrue(r.change.deletedAttr('loop'));
    H.assertTrue(r.change.deletedAttr('muted'));
    H.assertTrue(r.change.deletedAttr('crossorigin'));
    H.assertNotEqual(r.change.getAttr('src'), 'test.mp3');
    ExtMsg.clearMocks();
  });

  it('capture audio node that has source children and track children', async ()=> {
    const node = {type: 1, name: 'AUDIO', attr: {controls: ''},  childNodes: [
      {type: 1, name: 'SOURCE', attr: {src: 'test.mp3', type: 'audio/mp3'}},
      {type: 1, name: 'SOURCE', attr: {src: 'test.ogg', type: 'audio/ogg'}},
      {type: 1, name: 'TRACK', attr: {src: 'test.vtt'}},
    ]};
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 3);
    const [sourceA, sourceB, track] = node.childNodes;
    H.assertNotEqual(sourceA.change.attr.src, 'test.mp3')
    H.assertNotEqual(sourceB.change.attr.src, 'test.ogg')
    H.assertNotEqual(track.change.attr.src, 'test.vtt')
    H.assertFalse(r.change.hasAttr('data-mx-warn'));
    ExtMsg.clearMocks();
  });

  it('capture audio node that has currentSrc', async () => {
    const node = {type: 1, name: 'AUDIO', attr: {controls: ''},  childNodes: [
      {type: 1, name: 'SOURCE', attr: {src: 'test.mp3', type: 'audio/mp3'}},
      {type: 1, name: 'SOURCE', attr: {src: 'test.ogg', type: 'audio/ogg'}},
      {type: 1, name: 'TRACK', attr: {src: 'test.vtt'}},
    ]};
    node.currentSrc = 'test.mp4';
    const params = getParams();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    ExtMsg.mockGetUniqueFilename();
    params.config.htmlCaptureAudio = 'saveCurrent';
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 2);

    const [audioTask, trackTask] = r.tasks;
    H.assertMatch(audioTask.url, /\.mp4/);
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
