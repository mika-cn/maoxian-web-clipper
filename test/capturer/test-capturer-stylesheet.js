import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import {CSSRULE_TYPE} from '../../src/js/lib/constants.js';
import RequestParams from '../../src/js/lib/request-params.js';
import WhiteSpace from '../../src/js/lib/white-space.js';
import Capturer from '../../src/js/capturer/stylesheet.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);

function getParams() {
  const url = 'https://a.org/index.html';
  return {
    docBaseUrl: url,
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
      raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
      valueObj: {now: Date.now()},
    },
    clipId: '001',
    config: {
      htmlCaptureCssImage: 'remove',
      htmlCaptureWebFont: 'remove',
      htmlWebFontFilter: 'woff,woff2',
    },
    requestParams: RequestParams.createExample({refUrl: url}),
    cssParams: {removeUnusedRules: false},
    whiteSpace: WhiteSpace.create({step: 2, compress: false}),
  }
}

function createSheet(rules, url) {
  return {
    url: url,
    disabled: false,
    title: 'TITLE',
    rules: rules,
  }
}

function createStyleRule(selectorText, propertyName, propertyValue) {
  return {
    type: CSSRULE_TYPE.STYLE,
    selectorText: selectorText,
    styleObj: {[propertyName]: propertyValue},
  }
}

function createImportRule(sheet, url) {
  return {
    type: CSSRULE_TYPE.IMPORT,
    url: url,
    sheet: sheet,
  }
}

function createFontRule(propertyName, propertyValue) {
  return {
    type: CSSRULE_TYPE.FONT_FACE,
    styleObj: {[propertyName]: propertyValue},
  }
}


describe('Capturer stylesheet', () => {

  const IMG_RULE_A = createStyleRule('.a', 'background',       'url(bg-a.jpg)');
  const IMG_RULE_B = createStyleRule('.b', 'background-image', "url('bg-b.png')");
  const IMG_RULE_C = createStyleRule('.c', 'border-image',     'url("bg-c.bmp")');
  const IMG_RULE_D = createStyleRule('.d', 'background-image', 'url("bg-d.webp"), url(bg-d.svg)');
  const IMG_RULE_E = createStyleRule('.e', 'cursor', 'url("cursor.ico")');

  it("capture text (css img) - htmlCaptureCssImage: 'remove'", async () => {
    const sheet = createSheet([IMG_RULE_A,
      IMG_RULE_B, IMG_RULE_C, IMG_RULE_D, IMG_RULE_E]);
    const params = getParams();
    params.baseUrl = params.docBaseUrl;
    params.ownerType = 'styleNode';

    ExtMsg.mockGetUniqueFilename();
    const {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 0);
    H.assertEqual(cssText.match(/url\(''\)/mg).length, 6);
  });

  it("capture text (css img) - styleNode, htmlCaptureCssImage: 'saveAll'", async () => {
    const sheet = createSheet([IMG_RULE_A]);
    const params = getParams();
    params.baseUrl = params.docBaseUrl;
    params.ownerType = 'styleNode';
    params.config.htmlCaptureCssImage = 'saveAll';
    ExtMsg.mockGetUniqueFilename();
    const {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 1);
    const [_, path] = cssText.match(/url\(\'(.+)\'\)/m);
    H.assertTrue(path.startsWith('assets/'));
  });

  it("capture text (css img) - linkNode, htmlCaptureCssImage: 'saveAll'", async () => {
    const sheet = createSheet([IMG_RULE_A,
      IMG_RULE_B, IMG_RULE_C, IMG_RULE_D, IMG_RULE_E]);

    const params = getParams();
    params.baseUrl = 'https://a.org/style.css';
    params.config.htmlCaptureCssImage = 'saveAll';
    params.ownerType = 'linkNode';

    ExtMsg.mockGetUniqueFilename();
    const {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 6);

    H.assertMatch(cssText, /url\('[^\.\/]+.jpg'\)/);
    H.assertMatch(cssText, /url\('[^\.\/]+.png'\)/);
    H.assertMatch(cssText, /url\('[^\.\/]+.bmp'\)/);
    H.assertMatch(cssText, /url\('[^\.\/]+.webp'\)/);
    H.assertMatch(cssText, /url\('[^\.\/]+.svg'\)/);
    H.assertMatch(cssText, /url\('[^\.\/]+.ico'\)/);
    H.assertNotMatch(cssText, /url\('assets\/.+'\)/);
  });

  it("capture text(imported rule)", async () => {
    const url = 'https://a.org/external.css';
    const externalSheet = createSheet([
      createStyleRule('color', 'red'),
    ], url)
    const rule = createImportRule(externalSheet, url);
    const sheet = createSheet([rule]);

    const params = getParams();
    params.baseUrl = params.docBaseUrl;
    params.ownerType = 'styleNode';

    ExtMsg.mockGetUniqueFilename();
    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 1);
  });

  const WEB_FONT_RULE_A = createFontRule('src', 'url(a.woff)')
  const WEB_FONT_RULE_B = createFontRule('src', "url('b.woff')")
  const WEB_FONT_RULE_C = createFontRule('src', 'url("c.woff")')

  it("capture text (web font) - htmlCaptureWebFont: 'remove'", async () => {
    const sheet = createSheet([WEB_FONT_RULE_A, WEB_FONT_RULE_B, WEB_FONT_RULE_C]);

    const params = getParams();
    params.baseUrl = params.docBaseUrl;
    params.ownerType = 'styleNode';

    ExtMsg.mockGetUniqueFilename();
    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 0);
    H.assertEqual(cssText.match(/url\(''\)/mg).length, 3);
  });

  it("capture text (web font) - asset path - text in document", async () => {
    const sheet = createSheet([WEB_FONT_RULE_A, WEB_FONT_RULE_B, WEB_FONT_RULE_C]);

    const params = getParams();
    params.baseUrl = params.docBaseUrl;
    params.config.htmlCaptureWebFont = 'saveAll';
    params.ownerType = 'styleNode';

    ExtMsg.mockGetUniqueFilename();
    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 3);
    H.assertEqual(tasks[0].url, 'https://a.org/a.woff');
    H.assertEqual(tasks[1].url, 'https://a.org/b.woff');
    H.assertEqual(tasks[2].url, 'https://a.org/c.woff');
    H.assertEqual(tasks[0].taskType, 'fontFileTask');
    H.assertEqual(cssText.match(/url\('assets\/[^\.\/]+.woff'\)/mg).length, 3);
  })

  it("capture text (web font) - asset path - text in style", async () => {
    const sheet = createSheet([WEB_FONT_RULE_A, WEB_FONT_RULE_B, WEB_FONT_RULE_C]);
    const params = getParams();
    params.baseUrl = 'https://a.org/style.css';
    params.config.htmlCaptureWebFont = 'saveAll';
    params.ownerType = 'linkNode';

    ExtMsg.mockGetUniqueFilename();
    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 3);
    H.assertEqual(tasks[0].url, 'https://a.org/a.woff');
    H.assertEqual(cssText.match(/url\('[^\.\/]+.woff'\)/mg).length, 3);
  });

  it("capture text (web font) - asset path - text in cdn", async () => {
    const sheet = createSheet([WEB_FONT_RULE_A, WEB_FONT_RULE_B, WEB_FONT_RULE_C]);
    const params = getParams();
    params.baseUrl = 'https://cdn.a.org/style.css';
    params.config.htmlCaptureWebFont = 'saveAll';
    params.ownerType = 'linkNode';

    ExtMsg.mockGetUniqueFilename();
    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 3);
    H.assertEqual(tasks[0].url, 'https://cdn.a.org/a.woff');
    H.assertEqual(cssText.match(/url\('[^\.\/]+.woff'\)/mg).length, 3);
  });



  const WEB_FONT_RULE_X = createFontRule('src', 'url(a.woff)')
  const WEB_FONT_RULE_Y = createFontRule('src', "url('b.woff2')")
  const WEB_FONT_RULE_Z = createFontRule('src', 'url("c.otf")')

  it("capture text (web font) - option: filterList, should save unmatched files", async () => {
    const sheet = createSheet([WEB_FONT_RULE_X, WEB_FONT_RULE_Y, WEB_FONT_RULE_Z]);
    const params = getParams();
    params.baseUrl = params.docBaseUrl;
    params.config.htmlCaptureWebFont = 'filterList';
    params.config.htmlWebFontFilterList = 'woff|woff2'
    params.ownerType = 'styleNode';
    ExtMsg.mockGetUniqueFilename();
    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 3);
    H.assertEqual(tasks[0].url, 'https://a.org/a.woff');
    H.assertEqual(tasks[1].url, 'https://a.org/b.woff2');
    // all filters are not match, still saved
    H.assertEqual(tasks[2].url, 'https://a.org/c.otf');
  });

  const N_URL_FONT_RULE = createFontRule('src', ""
    + "url(a.woff) format(woff),"
    + "url('b.woff2') format(woff2),"
    + 'url("c.otf") format(opentype)'
  );

  it("capture text (web font) - option: filterList, should only match first filter", async () => {
    const sheet = createSheet([N_URL_FONT_RULE]);
    const params = getParams();
    params.baseUrl = params.docBaseUrl;
    params.config.htmlCaptureWebFont = 'filterList';
    params.config.htmlWebFontFilterList = 'woff|woff2|otf';
    params.ownerType = 'styleNode';
    ExtMsg.mockGetUniqueFilename();
    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 1);
    H.assertEqual(tasks[0].url, 'https://a.org/a.woff');
  });

  it("capture text (web font) - option: filterList, matches multiple extensions", async () => {
    const sheet = createSheet([N_URL_FONT_RULE]);
    const params = getParams();
    params.baseUrl = params.docBaseUrl;
    params.config.htmlCaptureWebFont = 'filterList';
    params.config.htmlWebFontFilterList = 'woff,woff2|otf';
    params.ownerType = 'styleNode';
    ExtMsg.mockGetUniqueFilename();
    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 2);
  });


});
