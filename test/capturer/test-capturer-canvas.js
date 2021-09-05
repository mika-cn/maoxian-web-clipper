import browser from 'sinon-chrome';
global.browser = browser;

const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import Capturer from '../../src/js/capturer/canvas.js';

const ExtMsg = H.depMockJs('ext-msg.js');
ExtMsg.initBrowser(browser);

function getParams(doc, canvasDataUrlDict = {}) {
  return {
    saveFormat: 'html',
    clipId: '001',
    storageInfo: {
      assetFolder: 'category-a/clippings/assets',
      assetRelativePath: 'assets',
      raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
      valueObj: {now: Date.now()},
    },
    doc: doc,
    canvasDataUrlDict: canvasDataUrlDict,
  }
}

describe('Capture Canvas', () => {

  it("Capturer Canvas: without marker", async () => {
    const html = "<canvas></canvas>";
    const {node, doc} = DOMTool.parseHTML(win, html);
    const params = getParams(doc);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.hasAttribute('data-mx-ignore-me'));
  });

  it("Capturer Canvas: with marker [html]", async () => {
    const html = '<canvas data-mx-marker="canvas-image" data-mx-id="x1"></canvas>';
    const canvasDataUrlDict = {"x1": "data:image/png;base64,imagedata"};
    const {node, doc} = DOMTool.parseHTML(win, html);
    const params = getParams(doc, canvasDataUrlDict);
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertTrue(r.node.hasAttribute('style'));
    H.assertFalse(r.node.hasAttribute('data-mx-marker'));
    H.assertFalse(r.node.hasAttribute('data-mx-id'));
    ExtMsg.clearMocks();
  })

  it("Capturer Canvas: with marker [md]", async () => {
    const html = '<canvas data-mx-marker="canvas-image" data-mx-id="x1"></canvas>';
    const canvasDataUrlDict = {"x1": "data:image/png;base64,imagedata"};
    const {node, doc} = DOMTool.parseHTML(win, html);
    const params = getParams(doc, canvasDataUrlDict);
    params.saveFormat = 'md';
    ExtMsg.mockGetUniqueFilename();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.node.tagName, 'IMG');
    H.assertEqual(r.tasks.length, 1);
    H.assertFalse(r.node.hasAttribute('data-mx-marker'));
    H.assertFalse(r.node.hasAttribute('data-mx-id'));
    ExtMsg.clearMocks();
  })

});
