const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import T from '../../src/js/lib/dom-tool.js';


function getHtml() {
  return `
    <root name="root" deep="0">
      PreText
      <branch name="branchA">A</branch>
      <branch name="branchB">B</branch>
      <branch name="branchC">C</branch>
      PostText
    </root>`;
}

function getHtml2() {
  return `
    <root>
      <div></div>
      <div>
        <target></target>
      </div>
      <div></div>
    </root>
    `;
}

describe('DomTool', () => {

  it("parseHTML", () => {
    const html = getHtml();
    const {node} = T.parseHTML(win, html);
    H.assertEqual(node.children.length, 3);
  });

  it("remove node by xpaths", () => {
    const html = getHtml();
    const {doc, node} = T.parseHTML(win, html);
    const newNode = T.removeNodeByXpaths(doc, node, [
      "*[1]",
      "*[3]"
    ]);
    H.assertEqual(newNode.children.length, 1);
    const branchA = newNode.querySelector("branch[name=branchA]");
    const branchB = newNode.querySelector("branch[name=branchB]");
    const branchC = newNode.querySelector("branch[name=branchC]");
    H.assertEqual(branchA, null);
    H.assertNotEqual(branchB, null);
    H.assertEqual(branchC, null);
  });

  it("calcXpath", () => {
    const html = getHtml2();
    const {doc, node} = T.parseHTML(win, html);
    const target = node.querySelector('target');
    H.assertEqual(T.calcXpath(node, target), '*[2]/*[1]');
    H.assertEqual(T.calcXpath(node, node), '');
    H.assertEqual(T.calcXpath(target, node), '');
  });

  it("find node by xpath", () => {
    const html = getHtml2();
    const {doc, node} = T.parseHTML(win, html);
    const target = T.findNodeByXpath(doc, node, '*[2]/*[1]');
    H.assertEqual(target.tagName.toUpperCase(), 'TARGET');
  });

})
