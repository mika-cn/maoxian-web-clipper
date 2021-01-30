const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import Capturer from '../../src/js/capturer/img.js';
import RequestParams from '../../src/js/lib/request-params.js';

function getNode(src, srcset) {
  let html = `<img src="${src}" $srcset crossorigin="anonymous"/>`;
  if (srcset) {
    html = html.replace('$srcset', `srcset="${srcset}"`);
  } else {
    html = html.replace('$srcset', '');
  }
  const {node} = DOMTool.parseHTML(win, html);
  return node;
}

function getParams() {
  const url = 'https://a.org/index.html';
  return {
    src: 'a.jpg',
    srcset: 'a.png 200w, b.png  400w',
    saveFormat: 'html',
    baseUrl: url,
    storageInfo: {
      assetFolder: 'category-a/clippings/assets',
      assetRelativePath: 'assets'
    },
    clipId: '001',
    requestParams: RequestParams.createExample({refUrl: url}),
  }
}

describe('Capture Img', () => {

  it('capture empty src', async () => {
    const params = getParams();
    const node = getNode('');
    let r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.getAttribute('data-mx-warn').length > 0);
    H.assertTrue(r.node.hasAttribute('data-mx-original-src'));

    node.removeAttribute('src');
    node.removeAttribute('data-mx-warn');
    node.removeAttribute('data-mx-original-src');

    r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.hasAttribute('data-mx-warn'));
    H.assertTrue(r.node.hasAttribute('data-mx-original-src'));
  });

  it('capture img src', async () => {
    const params = getParams();
    const {src, storageInfo} = params;
    const node = getNode(src);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertMatch(r.node.getAttribute('src'), /^assets\/001-[^\/]+\.jpg/);
    H.assertTrue(r.tasks[0].filename.startsWith(storageInfo.assetFolder));
    H.assertEqual(r.node.getAttribute('srcset'), null);
    H.assertEqual(r.node.getAttribute('crossorigin'), null);
  });

  it('capture img srcset', async () => {
    const params = getParams();
    const {src, srcset} = params;
    const node = getNode(src, srcset);
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 3);
    const srcsetItems = r.node.getAttribute('srcset').split(',');
    H.assertMatch(srcsetItems[0], /^assets\/[^\/]+.png 200w$/);
    H.assertMatch(srcsetItems[1], /^assets\/[^\/]+.png 400w$/);
  });

  it('capture img srcset [markdown]', async () => {
    const params = getParams();
    const {src, srcset} = params;
    const node = getNode(src, srcset);
    const r = await Capturer.capture(node, Object.assign({}, params, {saveFormat: 'md'}));
    H.assertEqual(r.tasks.length, 1);
  })

});
