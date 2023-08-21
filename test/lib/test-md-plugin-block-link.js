import jsdomApi from 'jsdom';
const jsdom = new jsdomApi.JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import mdPlugin from '../../src/js/lib/md-plugin-block-link.js';

describe('MdPluginBlockLink', () => {

  const ATTR_MARKER = 'data-mx-ignore-me';

  function getParams(html) {
    const {doc, node} = DOMTool.parseHTML(win, `<div class="context">${html}</div>`,);
    return {doc, contextNode: node};
  }

  it('Should not touch normal links', () => {
    const html = '<a href="x">link <em>text</em></a>';
    const {doc, contextNode} = getParams(html);
    const originHTML = contextNode.innerHTML;
    const node = mdPlugin.handle(doc, contextNode);
    H.assertEqual(node.innerHTML, originHTML);
  });

  it('Should ignore empty blocks', () => {
    const html = '<a href="x">link text<div class="empty"></div></a>';
    const {doc, contextNode} = getParams(html);
    const originHTML = contextNode.innerHTML;
    const node = mdPlugin.handle(doc, contextNode);
    const emptyBlock = node.querySelector('.empty');
    H.assertTrue(emptyBlock.hasAttribute(ATTR_MARKER));
  });

  it('Should handle normal wrapper', () => {
    const html = '<a href="x"><div class="wrapper">link text</div></a>';
    const {doc, contextNode} = getParams(html);
    const node = mdPlugin.handle(doc, contextNode);
    const div = node.querySelector('.wrapper');
    H.assertTrue(div.hasAttribute(ATTR_MARKER));
  });

  it('Should handle deep wrapper', () => {
    const html = '<a href="x"><div class="wrapper"><div class="wrapper"><img src="x.png"></div></div></a>';
    const {doc, contextNode} = getParams(html);
    const node = mdPlugin.handle(doc, contextNode);
    const wrappers = node.querySelectorAll('.wrapper');
    [].forEach.call(wrappers, (it) => H.assertTrue(it.hasAttribute(ATTR_MARKER)));
  });

  it('should handle picture block links', () => {
    const html = '<a href="x"><div class="wrapper"><picture><img src="x.png"></picture></div></a>';
    const {doc, contextNode} = getParams(html);
    const node = mdPlugin.handle(doc, contextNode);
    const div = node.querySelector('.wrapper');
    H.assertTrue(div.hasAttribute(ATTR_MARKER));
  });

  it('should handle figure', () => {
    const html = '<a href="x"><figure class="wrapper"><img src="x.png"></figure></a>';
    const {doc, contextNode} = getParams(html);
    const node = mdPlugin.handle(doc, contextNode);
    const div = node.querySelector('.wrapper');
    H.assertTrue(div.hasAttribute(ATTR_MARKER));
  });

  it('should handle figure with figcaption', () => {
    const html = '<a href="x"><figure class="wrapper"><img src="x.png"><figcaption>caption</figcaption></figure></a>';
    const extraAssetFn = (node) => {
      const figure = node.querySelector('.wrapper');
      H.assertFalse(figure.hasAttribute(ATTR_MARKER));
    };

    shouldWrapContentWithLinks(html, extraAssetFn);
  });

  it('should handle header link', () => {
    const html = '<a href="x"><h2>Header 2</h2></a>';
    const {doc, contextNode} = getParams(html);
    const node = mdPlugin.handle(doc, contextNode);
    const header = node.querySelector('h2');
    H.assertNotEqual(header.parentNode.nodeName, 'A')
    H.assertEqual(header.childNodes.length, 1);
    H.assertEqual(header.childNodes[0].nodeName, 'A');
  });

  it('should handle multiple lines header link', () => {
    const html = '<a href="x"><h2>Line A<br>Line B</h2></a>';
    const {doc, contextNode} = getParams(html);
    const node = mdPlugin.handle(doc, contextNode);
    const header = node.querySelector('h2');
    H.assertNotEqual(header.parentNode.nodeName, 'A')
    H.assertEqual(header.childNodes.length, 4);
  });

  it('should handle multiple lines of text', () => {
    const html = '<a href="x">line A<br>line B<br>line C</a>';
    shouldWrapContentWithLinks(html);
  });

  function shouldWrapContentWithLinks(html, extraAssetFn) {
    const {doc, contextNode} = getParams(html);
    const originBrNodeNum = contextNode.querySelectorAll('br').length;
    const node = mdPlugin.handle(doc, contextNode);
    const [firstLink, secondLink] = node.querySelectorAll('a');
    const increasedBrNum = node.querySelectorAll('br').length - originBrNodeNum;
    H.assertEqual(firstLink.textContent, '↓↓↓');
    H.assertEqual(secondLink.textContent, '↑↑↑');
    H.assertEqual(increasedBrNum, 4);

    if (extraAssetFn) { extraAssetFn(node) }
  }


});
