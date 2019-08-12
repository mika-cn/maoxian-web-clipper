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
    const {baseUrl, storageInfo, clipId} = getParams();
    const node = getNode('');
    let tasks = Capturer.capture(node, {baseUrl, clipId, storageInfo});
    H.assertEqual(tasks.length, 0);
    H.assertTrue(node.getAttribute('data-mx-warn').length > 0);

    node.removeAttribute('src');
    tasks = Capturer.capture(node, {baseUrl, clipId, storageInfo});
    H.assertEqual(tasks.length, 0);
    H.assertTrue(node.getAttribute('data-mx-warn').length > 0);
  });

  it('capture img src', () => {
    const {src, baseUrl, storageInfo, clipId} = getParams();
    const node = getNode(src);
    const tasks = Capturer.capture(node, {baseUrl, clipId, storageInfo});
    H.assertEqual(tasks.length, 1);
    H.assertMatch(node.getAttribute('src'), /^assets\/001-[^\/]+\.jpg/);
    H.assertTrue(tasks[0].filename.startsWith(storageInfo.assetFolder));
    H.assertEqual(node.getAttribute('srcset'), null);
    H.assertEqual(node.getAttribute('crossorigin'), null);
  });

  it('capture img srcset', () => {
    const {src, srcset, baseUrl, storageInfo, clipId} = getParams();
    const node = getNode(src, srcset);
    const tasks = Capturer.capture(node, {baseUrl, clipId, storageInfo});
    H.assertEqual(tasks.length, 3);
    const srcsetItems = node.getAttribute('srcset').split(',');
    H.assertMatch(srcsetItems[0], /^assets\/[^\/]+.png 200w$/);
    H.assertMatch(srcsetItems[1], /^assets\/[^\/]+.png 400w$/);
  });

});
