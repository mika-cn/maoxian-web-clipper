import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CapturerLink from '../../src/js/capturer/link.js';
import RequestParams from '../../src/js/lib/request-params.js';
import {CSSRULE_TYPE} from '../../src/js/lib/constants.js';

const Capturer = H.wrapAsyncCapturer(CapturerLink);

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);


function getNode(relList, attr = {}, sheet) {
  return {
    type: 1,
    name: 'LINK',
    relList: relList,
    attr: attr,
    sheet: sheet,
  }
}

function getParams() {
  const url = 'https://a.org/index.html';
  return {
    docUrl: url,
    baseUrl: url,
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
      raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
      valueObj: {now: Date.now()},
    },
    clipId: '001',
    config: {
      htmlCaptureWebFont: 'remove',
      htmlCaptureCssImage: 'remove',
      htmlCaptureIcon: 'saveAll',
    },
    requestParams: RequestParams.createExample({refUrl: url}),
  }
}

describe('Capture link', () => {

  it('capture link without rel attribute', async () => {
    const node = getNode([], {href: '_'});
    const params = getParams();
    const {change, tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    H.assertTrue(change.getProperty('ignore'));
  });

  it('capture link without href attribute', async () => {
    const node = getNode(['stylesheet'], {rel: 'stylesheet'});
    const params = getParams();
    const {change, tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    H.assertTrue(change.getProperty('ignore'));
  });

  it('capture link rel="icon"', async() => {
    const node = getNode(['icon'], {rel: 'icon', href: 'a.icon'});
    const params = getParams();
    ExtMsg.mockGetUniqueFilename();
    const {change, tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 1);
    H.assertMatch(change.getAttr('href'), /assets\/[^\.\/]+\.icon/);
    ExtMsg.clearMocks();
  });

  it('capture link rel="shortcut icon"', async() => {
    const node = getNode(['shortcut', 'icon'], {rel: 'shortcut icon', href: 'a.icon'});
    const params = getParams();
    ExtMsg.mockGetUniqueFilename();
    const {tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 1);
    ExtMsg.clearMocks();
  });


  it('capture link rel="apple-touch-icon-precomposed"', async() => {
    const node = getNode(['apple-touch-icon-precomposed'],
      {rel:'apple-touch-icon-precomposed', href: 'a', type: 'image/png'});
    const params = getParams();
    ExtMsg.mockGetUniqueFilename();
    ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
    const {change, tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 1);
    H.assertMatch(change.getAttr('href'), /assets\/[^\.\/]+\.png/);
    ExtMsg.clearMocks();
  });

  async function testCaptureStylesheet(linkType, href) {
    const linkTypes = [linkType.toLowerCase()];
    const sheet = {
      href: `https://a.org/${href}`,
      diabled: false,
      title: 'TITLE',
      rules: [
        {
          type: CSSRULE_TYPE.STYLE,
          selectorText: 'body',
          styleObj: {background: 'red'}
        }
      ]
    };

    const node = getNode(linkTypes, {href: href, rel: linkType}, sheet);
    const params = getParams();
    ExtMsg.mockGetUniqueFilename()
    const {change, tasks} = await Capturer.capture(node, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 1);
    H.assertEqual(change.getAttr('referrerpolicy'), 'no-referrer');
    H.assertTrue(change.deletedAttr('integrity'));
    H.assertTrue(change.deletedAttr('crossorigin'));
    H.assertMatch(change.getAttr('href'), /assets\/[^\.\/]+\.css/);
  }

  it('capture rel="stylesheet"', async () => {
    await testCaptureStylesheet('stylesheet', 'style-A.css');
  });

  it('capture rel="Stylesheet"', async() => {
    await testCaptureStylesheet('Stylesheet', 'style-A.css');
  });

  it('capture rel="Stylesheet" that have not extension', async() => {
    await testCaptureStylesheet('Stylesheet', 'style-A');
  });

  it('capture rel="alternate stylesheet" disabled', async() => {
    const linkTypes = ['alternate', 'stylesheet'];
    const attrs = {rel: 'alternate Stylesheet', href: 'style-A.css', disabled: ''};
    const sheet = {disabled: true}
    const node = getNode(linkTypes, attrs, sheet);
    const params = getParams();
    const {change, tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    H.assertTrue(change.getProperty('ignore'));
  });

  it('should not capture links with rel="preload"', async() => {
    const linkTypes = ['preload'];
    const attrs = {rel: 'preload', href: 'style-A.css'};
    const node = getNode(linkTypes, attrs);
    const params = getParams();
    const {change, tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    H.assertTrue(change.getProperty('ignore'));
  });


});
