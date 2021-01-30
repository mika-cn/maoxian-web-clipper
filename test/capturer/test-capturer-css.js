import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';

import DOMTool from '../../src/js/lib/dom-tool.js';

import Capturer from '../../src/js/capturer/css.js';
import RequestParams from '../../src/js/lib/request-params.js';

const ExtMsg = H.depMockJs('ext-msg.js');
ExtMsg.initBrowser(browser);

function getParams() {
  const url = 'https://a.org/index.html';
  return {
    docUrl: url,
    storageInfo: {
      assetFolder: 'category-a/clippings/assets',
      assetRelativePath: 'assets'
    },
    clipId: '001',
    config: {
      saveWebFont: false,
      saveCssImage: false
    },
    requestParams: RequestParams.createExample({refUrl: url}),
    needFixStyle: false,
  }
}

describe("Capturer css", () => {

  it("capture text (@import css)", async () => {
    const params = getParams();
    params.baseUrl = 'https://cdn.a.org/style.css';
    //@import url("chrome://communicator/skin/");
    params.text = `
      @import url("a.css") print;
      @import url("b.css") speech;
      @import 'c.css';
      @import "d.css" screen;
      @import url('e.css') screen and (orientation:landscape);
      @import url('e.css');
    `;
    const linkText = '.CSSTEXT{}';
    ExtMsg.mockFetchTextStatic(linkText)
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 5);
    tasks.forEach((it) => {
      H.assertEqual(it.text, linkText);
      H.assertEqual(it.mimeType, 'text/css');
    });
    ExtMsg.clearMocks();
  });

  it("capture link - circle with self", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    params.link = 'style-A.css';
    ExtMsg.mockFetchTextUrls({
      "https://a.org/style-A.css": "@import 'style-A.css';"
    });
    const tasks = await Capturer.captureLink(params);
    ExtMsg.clearMocks();
    H.assertEqual(tasks.length, 1);
    const filename = tasks[0].filename.split('/').pop();
    H.assertTrue(tasks[0].text.indexOf(filename) > -1);
  })

  it("capture link - circle in two style", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    params.link = 'style-A.css';
    ExtMsg.mockFetchTextUrls({
      "https://a.org/style-A.css": "@import 'style-B.css';",
      "https://a.org/style-B.css": "@import 'style-A.css';",
    });
    const tasks = await Capturer.captureLink(params);
    ExtMsg.clearMocks();
    const [taskA, taskB] = tasks;
    const taskAFilename = taskA.filename.split('/').pop();
    const taskBFilename = taskB.filename.split('/').pop();
    H.assertTrue(taskA.text.indexOf(taskBFilename) > -1)
    H.assertTrue(taskB.text.indexOf(taskAFilename) > -1)
  });

  const WEB_FONT_CSS_A = `@font-face {src: url(foo.woff);}`;
  const WEB_FONT_CSS_B = `@font-face {src: url('foo.woff');}`;
  const WEB_FONT_CSS_C = `@font-face {src: url("foo.woff");}`;

  it("capture text (web font) - default config", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    const texts = [
      WEB_FONT_CSS_A,
      WEB_FONT_CSS_B,
      WEB_FONT_CSS_C
    ];
    for(let i = 0; i < texts.length; i++) {
      params.text = texts[i];
      var {cssText, tasks} = await Capturer.captureText(params);
      H.assertEqual(tasks.length, 0);
      H.assertMatch(cssText, /url\(""\)/);
    }
  });

  it("capture text (web font) - asset path - text in document", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    params.config.saveWebFont = true;
    params.text = WEB_FONT_CSS_A;
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 1);
    H.assertEqual(tasks[0].url, 'https://a.org/foo.woff');
    H.assertMatch(cssText, /url\("assets\/[^\.\/]+.woff"\)/);
  })

  it("capture text (web font) - asset path - text in style", async () => {
    const params = getParams();
    params.text = WEB_FONT_CSS_A;
    params.config.saveWebFont = true;
    params.baseUrl = 'https://a.org/style.css';
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 1);
    H.assertMatch(cssText, /url\("[^\.\/]+.woff"\)/);
  });

  it("capture text (web font) - asset path - text in cdn", async () => {
    const params = getParams();
    params.text = WEB_FONT_CSS_A;
    params.config.saveWebFont = true;
    params.baseUrl = 'https://cdn.a.org/style.css';
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 1);
    H.assertMatch(cssText, /url\("[^\.\/]+.woff"\)/);
  });

  const IMG_CSS = `
    .t1 { color: red;background: url(bg-a.jpg); }
    .t2 { background-image: url('bg-b.png'); }
    .t3 {
      color: red;
      border-image: url("bg-c.bmp");
      font-size:14pt;
    }
  `;

  it("capture text (css img) - default", async () => {
    const params = getParams();
    params.baseUrl = params.docUrl;
    params.text = IMG_CSS;
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 0);
    H.assertEqual(cssText.match(/url\(""\)/mg).length, 3);
  });

  it("capture text (css img) - asset path - text in style", async () => {
    const params = getParams();
    params.text = IMG_CSS;
    params.baseUrl = 'https://a.org/style.css';
    params.config.saveCssImage = true;
    var {cssText, tasks} = await Capturer.captureText(params);
    H.assertEqual(tasks.length, 3);
    H.assertMatch(cssText, /url\("[^\.\/]+.jpg"\)/);
    H.assertMatch(cssText, /url\("[^\.\/]+.png"\)/);
    H.assertMatch(cssText, /url\("[^\.\/]+.bmp"\)/);
  });

  function testFixStyle(text, n = 1) {
    it("fix style : " + text, async() => {
      const params = getParams();
      params.needFixStyle = true;
      params.text = text;
      const {cssText, tasks} = await Capturer.captureText(params);
      const match = cssText.match(/body > \.mx-wc-main >/mg);
      if (n > 0) {
        H.assertNotEqual(match, null);
        H.assertEqual(match.length, n);
      } else {
        H.assertEqual(match, null);
      }
    });
  }

  testFixStyle('body > .target');
  testFixStyle(' body > .target');
  testFixStyle('}body>.target');
  testFixStyle('} body>.target');
  testFixStyle('\nbody>.target');
  testFixStyle('header,body > .target');
  testFixStyle('body > .target{}\nbody>.target{}', 2);
  testFixStyle('.body > .target', 0);

})




