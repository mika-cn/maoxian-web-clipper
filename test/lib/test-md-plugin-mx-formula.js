
import jsdomApi from 'jsdom';
const jsdom = new jsdomApi.JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import T       from '../../src/js/lib/tool.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import mdPlugin from '../../src/js/lib/md-plugin-mx-formula.js';

describe('MdPluginMxFormula', () => {
  it('should handle <mx-inline-formula>', () => {
    const html = '<div><mx-inline-formula value="FORMULA"></div>'
    const {doc, node: elem} = DOMTool.parseHTML(win, html);
    const node = mdPlugin.handle(doc, elem);
    const code = node.querySelector('code');
    H.assertNotEqual(code, null);
    H.assertEqual(
      code.textContent,
      'MX_FORMULA___FORMULA___MX_FORMULA'
    );
  });

  it('should handle <mx-block-formula>', () => {
    const html = '<div><mx-block-formula value="FORMULA"></div>'
    const {doc, node: elem} = DOMTool.parseHTML(win, html);
    const node = mdPlugin.handle(doc, elem);
    const code = node.querySelector('code');
    H.assertNotEqual(code, null);
    H.assertEqual(
      code.textContent,
      'MX_FORMULA_BLOCK___FORMULA___MX_FORMULA_BLOCK'
    );
  });


  it("should escape formula wrapper", () => {
    const textA = "`MX_FORMULA___FORMULA___MX_FORMULA`";
    const textB = "`MX_FORMULA_BLOCK___FORMULA___MX_FORMULA_BLOCK`";
    const formulaBlockWrapper = ["\n\n$$$", "$$$\n\n"]
    H.assertEqual(
      mdPlugin.unEscapeMxFormula(textA, formulaBlockWrapper),
      '$FORMULA$'
    );
    H.assertEqual(
      mdPlugin.unEscapeMxFormula(textB, formulaBlockWrapper),
      '\n\n$$FORMULA$$\n\n'
    );
  });


  it("should escape formula", () => {
    const formula = "<>&";
    const html = `<div><mx-inline-formula value="${T.escapeHtml(formula)}"></div>`
    const {doc, node: elem} = DOMTool.parseHTML(win, html);
    const node = mdPlugin.handle(doc, elem);
    const code = node.querySelector('code');
    H.assertEqual(code.textContent, 'MX_FORMULA___<>&___MX_FORMULA')
  });
});
