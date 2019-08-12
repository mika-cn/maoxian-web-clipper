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
  const {node} = DOMTool.parseHTML(html);
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
    let tasks = Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    H.assertTrue(node.getAttribute('data-mx-warn').length > 0);
    H.assertTrue(node.hasAttribute('data-mx-original-src'));

    node.removeAttribute('src');
    node.removeAttribute('data-mx-warn');
    node.removeAttribute('data-mx-original-src');
    tasks = Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    H.assertTrue(node.hasAttribute('data-mx-warn'));
    H.assertTrue(node.hasAttribute('data-mx-original-src'));
  });

  it('capture img src', () => {
    const params = getParams();
    const {src, storageInfo} = params;
    const node = getNode(src);
    const tasks = Capturer.capture(node, params);
    H.assertEqual(tasks.length, 1);
    H.assertMatch(node.getAttribute('src'), /^assets\/001-[^\/]+\.jpg/);
    H.assertTrue(tasks[0].filename.startsWith(storageInfo.assetFolder));
    H.assertEqual(node.getAttribute('srcset'), null);
    H.assertEqual(node.getAttribute('crossorigin'), null);
  });

  it('capture img srcset', () => {
    const params = getParams();
    const {src, srcset} = params;
    const node = getNode(src, srcset);
    const tasks = Capturer.capture(node, params);
    H.assertEqual(tasks.length, 3);
    const srcsetItems = node.getAttribute('srcset').split(',');
    H.assertMatch(srcsetItems[0], /^assets\/[^\/]+.png 200w$/);
    H.assertMatch(srcsetItems[1], /^assets\/[^\/]+.png 400w$/);
  });

  it('capture img srcset [markdown]', () => {
    const params = getParams();
    const {src, srcset} = params;
    const node = getNode(src, srcset);
    const tasks = Capturer.capture(node, Object.assign({}, params, {saveFormat: 'md'}));
    H.assertEqual(tasks.length, 1);
  })

});
