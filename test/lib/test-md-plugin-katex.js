
import jsdomApi from 'jsdom';
const jsdom = new jsdomApi.JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import T       from '../../src/js/lib/tool.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import mdPlugin from '../../src/js/lib/md-plugin-katex.js';

describe('MdPluginKatex', () => {

  it('should not handle when katex structure is not matched', () => {
    const html = `<div><span class="katex-mathml"></span></div>`;
    const {doc, node: elem} = DOMTool.parseHTML(win, html);
    const node = mdPlugin.handle(doc, elem);
    const code = node.querySelector('code');
    H.assertEqual(code, null);
  });

  it('should handle katex html - inline', () => {
    const html = getHTML(false);
    const {doc, node: elem} = DOMTool.parseHTML(win, html);
    const node = mdPlugin.handle(doc, elem);
    const code = node.querySelector('code');
    H.assertNotEqual(code, null);
    H.assertEqual(
      node.textContent,
      'KATEX___FORMULA___KATEX'
    );
  });


  it('should handle katex html - block', () => {
    const html = getHTML(true);
    const {doc, node: elem} = DOMTool.parseHTML(win, html);
    const node = mdPlugin.handle(doc, elem);
    const code = node.querySelector('code');
    H.assertNotEqual(code, undefined);
    H.assertEqual(
      node.textContent,
      'KATEX_BLOCK___FORMULA___KATEX_BLOCK'
    );
  });


  it("should escape formula wrapper", () => {
    const textA = "`KATEX___FORMULA___KATEX`";
    const textB = "`KATEX_BLOCK___FORMULA___KATEX_BLOCK`";
    H.assertEqual(
      mdPlugin.unEscapeKatex(textA),
      '$FORMULA$'
    );
    H.assertEqual(
      mdPlugin.unEscapeKatex(textB),
      '\n\n$$FORMULA$$\n\n'
    );
  });

  it("should escape formula", () => {
    const formula = "<>&";
    const html = getHTML(false, formula);
    const {doc, node: elem} = DOMTool.parseHTML(win, html);
    const node = mdPlugin.handle(doc, elem);
    const code = node.querySelector('code');
    H.assertEqual(node.textContent, 'KATEX___<>&___KATEX')
  });


  function getHTML(isBlock = false, formula = "FORMULA") {
    const attr = isBlock ? ' class="katex-display"' : '';
    const html = (
       `<div>`
      +`<span${attr}>`
      +  `<span class="katex">`
      +    `<span class="katex-mathml">`
      +      `<math>`
      +         `<semantics>`
      +            `<mrow>MATHML TREE</mrow>`
      +            `<annotation encoding="application/x-tex">${T.escapeHtml(formula)}</annotation>`
      +         `</semantics>`
      +      `</math>`
      +    `</span>`
      +     `<span class="katex-html">HTML</span>`
      +  `</span>`
      +`<span>`
      +`</div>`
    );
    return html;
  }




});
