
import H from '../helper.js';
import {CSSRULE_TYPE} from '../../src/js/lib/constants.js';
import RequestParams from '../../src/js/lib/request-params.js';
import Capturer from '../../src/js/capturer/stylesheet.js';

function getParams() {
  const url = 'https://a.org/index.html';
  return {
    docUrl: url,
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
    },
    clipId: '001',
    config: {
      saveWebFont: false,
      saveCssImage: false
    },
    requestParams: RequestParams.createExample({refUrl: url}),
  }
}

function createSheet(rules) {
  return {
    href: undefined,
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

  it("capture text (css img) - saveCssImage: false", async () => {
    const sheet = createSheet([IMG_RULE_A,
      IMG_RULE_B, IMG_RULE_C, IMG_RULE_D]);
    const params = getParams();
    params.baseUrl = params.docUrl;
    params.ownerType = 'styleNode';

    const {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    H.assertEqual(tasks.length, 0);
    H.assertEqual(cssText.match(/url\(''\)/mg).length, 5);
  });

  it("capture text (css img) - saveCssImage: true", async () => {
    const sheet = createSheet([IMG_RULE_A,
      IMG_RULE_B, IMG_RULE_C, IMG_RULE_D]);

    const params = getParams();
    params.baseUrl = params.docUrl;
    params.baseUrl = 'https://a.org/style.css';
    params.config.saveCssImage = true;
    params.ownerType = 'linkNode';

    const {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    H.assertEqual(tasks.length, 5);
    H.assertMatch(cssText, /url\('[^\.\/]+.jpg'\)/);
    H.assertMatch(cssText, /url\('[^\.\/]+.png'\)/);
    H.assertMatch(cssText, /url\('[^\.\/]+.bmp'\)/);
    H.assertMatch(cssText, /url\('[^\.\/]+.webp'\)/);
    H.assertMatch(cssText, /url\('[^\.\/]+.svg'\)/);
  });

  const WEB_FONT_RULE_A = createFontRule('src', 'url(a.woff)')
  const WEB_FONT_RULE_B = createFontRule('src', "url('b.woff')")
  const WEB_FONT_RULE_C = createFontRule('src', 'url("c.woff")')

  it("capture text (web font) - saveWebFont: false", async () => {
    const sheet = createSheet([WEB_FONT_RULE_A, WEB_FONT_RULE_B, WEB_FONT_RULE_C]);

    const params = getParams();
    params.baseUrl = params.docUrl;
    params.ownerType = 'linkNode';

    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    H.assertEqual(tasks.length, 0);
    H.assertEqual(cssText.match(/url\(''\)/mg).length, 3);
  });

  it("capture text (web font) - asset path - text in document", async () => {
    const sheet = createSheet([WEB_FONT_RULE_A, WEB_FONT_RULE_B, WEB_FONT_RULE_C]);

    const params = getParams();
    params.baseUrl = params.docUrl;
    params.config.saveWebFont = true;
    params.ownerType = 'linkNode';

    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
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
    params.config.saveWebFont = true;
    params.ownerType = 'linkNode';

    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    H.assertEqual(tasks.length, 3);
    H.assertEqual(tasks[0].url, 'https://a.org/a.woff');
    H.assertEqual(cssText.match(/url\('[^\.\/]+.woff'\)/mg).length, 3);
  });

  it("capture text (web font) - asset path - text in cdn", async () => {
    const sheet = createSheet([WEB_FONT_RULE_A, WEB_FONT_RULE_B, WEB_FONT_RULE_C]);
    const params = getParams();
    params.baseUrl = 'https://cdn.a.org/style.css';
    params.config.saveWebFont = true;
    params.ownerType = 'linkNode';

    var {cssText, tasks} = await Capturer.captureStyleSheet(sheet, params);
    H.assertEqual(tasks.length, 3);
    H.assertEqual(tasks[0].url, 'https://cdn.a.org/a.woff');
    H.assertEqual(cssText.match(/url\('[^\.\/]+.woff'\)/mg).length, 3);
  });

});
