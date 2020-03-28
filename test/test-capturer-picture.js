const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;
const H = require('./helper.js');
const DOMTool = H.depJs('lib/dom-tool.js');
const Capturer = H.depJs('capturer/picture.js');

function getNode() {
  let html = `
    <picture>
      <source srcset="a.png 200w, b.png 400w">
      <source srcset="abc" type="image/jpeg">
      <source srcset="d.png" type="image/jpeg">
      <img src="img.png" title='default image' >
    </picture>`;
  const {node} = DOMTool.parseHTML(win, html);
  return node;
}


function getParams() {
  return {
    baseUrl: 'https://a.org/index.html',
    storageInfo: {
      assetFolder: 'category-a/clippings/assets',
      assetRelativePath: 'assets'
    },
    clipId: '001'
  }
}

describe('Capture Picture', () => {
  it('capture picture source element', ()=> {
    const {baseUrl, storageInfo, clipId} = getParams();
    const node = getNode();
    const r = Capturer.capture(node, {baseUrl, storageInfo, clipId});
    H.assertEqual(r.tasks.length, 4);
    const [sourceA, sourceB, sourceC, img] = r.node.children;
    H.assertMatch(sourceB.getAttribute('srcset'), /\.jpg$/);
    H.assertMatch(sourceC.getAttribute('srcset'), /\.png$/);
    H.assertEqual(img.getAttribute('src'), 'img.png');
  });
});
