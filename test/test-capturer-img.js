const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;
const H = require('./helper.js');
const DOMTool = H.depJs('lib/dom-tool.js');
const Capturer = H.depJs('capturer/img.js');

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
  return {
    src: 'a.jpg',
    srcset: 'a.png 200w, b.png  400w',
    saveFormat: 'html',
    baseUrl: 'https://a.org/index.html',
    storageInfo: {
      assetFolder: 'category-a/clippings/assets',
      assetRelativePath: 'assets'
    },
    clipId: '001'
  }
}

describe('Capture Img', () => {

  it('capture empty src', () => {
    const params = getParams();
    const node = getNode('');
    let r = Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.getAttribute('data-mx-warn').length > 0);
    H.assertTrue(r.node.hasAttribute('data-mx-original-src'));

    node.removeAttribute('src');
    node.removeAttribute('data-mx-warn');
    node.removeAttribute('data-mx-original-src');

    r = Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.node.hasAttribute('data-mx-warn'));
    H.assertTrue(r.node.hasAttribute('data-mx-original-src'));
  });

  it('capture img src', () => {
    const params = getParams();
    const {src, storageInfo} = params;
    const node = getNode(src);
    const r = Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 1);
    H.assertMatch(r.node.getAttribute('src'), /^assets\/001-[^\/]+\.jpg/);
    H.assertTrue(r.tasks[0].filename.startsWith(storageInfo.assetFolder));
    H.assertEqual(r.node.getAttribute('srcset'), null);
    H.assertEqual(r.node.getAttribute('crossorigin'), null);
  });

  it('capture img srcset', () => {
    const params = getParams();
    const {src, srcset} = params;
    const node = getNode(src, srcset);
    const r = Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 3);
    const srcsetItems = r.node.getAttribute('srcset').split(',');
    H.assertMatch(srcsetItems[0], /^assets\/[^\/]+.png 200w$/);
    H.assertMatch(srcsetItems[1], /^assets\/[^\/]+.png 400w$/);
  });

  it('capture img srcset [markdown]', () => {
    const params = getParams();
    const {src, srcset} = params;
    const node = getNode(src, srcset);
    const r = Capturer.capture(node, Object.assign({}, params, {saveFormat: 'md'}));
    H.assertEqual(r.tasks.length, 1);
  })

});
