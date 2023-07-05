import jsdomApi from 'jsdom';
const jsdom = new jsdomApi.JSDOM();
const win = jsdom.window;

import H from '../helper.js';
import DOMTool from '../../src/js/lib/dom-tool.js';
import mdPlugin from '../../src/js/lib/md-plugin-code.js';

describe('MdPluginCode', () => {

  function testFixLineBreaker(html, resultRe) {
    it('should fix linebreak (convert <br> to linebreak): ' + html, () => {
      const {doc, node: contextNode} = DOMTool.parseHTML(win, html);
      const node = mdPlugin.handle(doc, contextNode);
      H.assertMatch(node.textContent, resultRe);
    });
  }

  {
    const resultRe = /^code\ntext$/;
    testFixLineBreaker(`<pre>code<br>text</pre>`, resultRe);
    testFixLineBreaker(`<pre>code<br />text</pre>`, resultRe);
    testFixLineBreaker(`<pre>code<br class="x">text</pre>`, resultRe);
  }



  it('should ignore linebreak in the end', () => {
    const html = `
      <div>
        <div class="language-shell highlighter-rouge">
          <pre class="highlight">


            <code><span class="gt">code </span>text\n</code>

          </pre>
        </div>
      </div>
    `
    const {doc, node} = DOMTool.parseHTML(win, html);
    let contextNode = node;
    contextNode = mdPlugin.handle(doc, contextNode);
    const code = contextNode.querySelector('code').textContent;
    H.assertEqual(code, 'code text');
  });



  function testGetLanguage(html, language) {
    it('get language ' + language, () => {
      let {doc, node: contextNode} = DOMTool.parseHTML(win, html);
      contextNode = mdPlugin.handle(doc, contextNode);
      const preNodes = contextNode.querySelectorAll('pre');
      H.assertEqual(preNodes.length, 1);
      const child = preNodes[0].children[0];
      H.assertEqual(child.tagName.toUpperCase(), 'CODE');
      H.assertEqual(child.getAttribute('class'), ['language', language].join('-'));
    });
  }

  testGetLanguage(`<div><pre>code text</pre></div>`, 'plain');

  testGetLanguage(`
    <div>
      <pre class="lang-javascript">
        code text
      </pre>
    </div>
  `, 'javascript');

  testGetLanguage(`
    <div>
      <pre class="lang-javascript">

        <code class="shell">
          code text
        </code>
      </pre>
    </div>
  `, 'shell');

  testGetLanguage(`
    <div class="language-ruby highlight">
      <div class="highlight">
        <pre class="highlight">code text</pre>
      </div>
    </div>
  `, 'ruby');

  testGetLanguage(`
    <div>
      <pre>
        <div class="line" lang="ruby">line 1</div>
        <div class="line" lang="elixir">line 2</div>
        <div class="line" lang="elixir">line 3</div>
      </pre>
    </div>
  `, 'elixir');


  /*
  testGetLanguage(`
    <div>
      <pre>
        <div class="line ruby">line 1</div>
        <div class="line elixir">line 2</div>
        <div class="line elixir">line 3</div>
      </pre>
    </div>
  `, 'elixir');
  */


  testGetLanguage(`
    <div>
      <pre class="line" lang="css">line 1</pre>
      <pre class="line" lang="text">line 2</pre>
      <pre class="line" lang="css">line 3</pre>
    </div>
  `, 'css');

  /*
  testGetLanguage(`
    <div>
      <pre class="line css">line 1</pre>
      <pre class="line text">line 2</pre>
      <pre class="line css">line 3</pre>
    </div>
  `, 'css');
  */




  it('should merge <pre> lines when using as line wrapper', () => {
    // get from CoffeeScript (Zeal)
    const html = `
      <div>
        <div class="will-merge">
          <pre class="line"><span>line 1</span></pre>
          <pre class="line"><span>line</span> 2</pre>
          <pre class="line">line <span>3</span></pre>
        </div>

        <div class="will-not-merge">
          <p> Example: </p>
          <pre class="line">code text</pre>
          <pre class="line">code text</pre>
        </div>
      </div>
    `;
    const {doc, node} = DOMTool.parseHTML(win, html);
    let contextNode = node;
    contextNode = mdPlugin.handle(doc, contextNode);
    const nodesA = contextNode.querySelectorAll('pre');
    const nodesB = contextNode.querySelectorAll('.will-not-merge pre');
    H.assertEqual(nodesA.length, 3);
    H.assertEqual(nodesB.length, 2);
  });


  it('should handle Using block element as code line', () => {
    // get from Load-Dash (Zeal)
    const html = (
      `<div class="highlight js">`
    +   `<pre>`
    +     `<div><span>line 1</span></div>`
    +     `<div><span>line</span> 2</div>`
    +     `<div>line <span>3</span></div>`
    +   `</pre>`
    + `</div>`
    );

    const {doc, node} = DOMTool.parseHTML(win, html);
    let contextNode = node;
    contextNode = mdPlugin.handle(doc, contextNode);
    const code = contextNode.querySelector('code').textContent;
    const matches = code.match(/\n/mg);
    H.assertEqual(matches.length, 2);
  });




  function testPreCodeWithButtons(html) {
    it("remove buttons", () => {
      const {doc, node} = DOMTool.parseHTML(win, html);
      let contextNode = node;
      contextNode = mdPlugin.handle(doc, contextNode);
      const buttons = contextNode.querySelectorAll('.button');
      H.assertEqual(buttons.length, 0);
      const code = contextNode.querySelector('code');
      H.assertNotEqual(code, null);
      H.assertEqual(code.textContent, 'hello\nworld')

      const wrapper = code.parentNode;
      H.assertEqual(wrapper.children.length, 1)
    });
  }

  {
    // get from rust (Zeal)
    //
    //   nested pre node
    //   buttons inside pre node
    const html = `
      <div>
        <pre class="playpen">
          <div class="buttons">
            <button></button>
            <button></button>
          </div>
        <code class="language-rust hljs">hello\n<span>world</span></code>
        </pre>
      </div>
    `;
    testPreCodeWithButtons(html);
  }

  {
    // button at the bottom
    const html = `
      <div>
        <pre class="playpen">
        <code class="language-rust hljs">hello\n<span>world</span></code>
          <div class="buttons">
            <button></button>
            <button></button>
          </div>
        </pre>
      </div>
    `;
    testPreCodeWithButtons(html);
  }

  {
    // button at both sides.
    const html = `
      <div>
        <pre class="playpen">
          <div class="buttons">
            <button></button>
            <button></button>
          </div>
          <code class="language-rust hljs">hello\n<span>world</span></code>
          <div class="buttons">
            <button></button>
            <button></button>
          </div>
        </pre>
      </div>
    `;
    testPreCodeWithButtons(html);
  }


  {
    // juejin code
    const html = ""
      + '<div>'
      +   '<pre>'
      +    '<div class="code-block-extention-head">'
      +      '<div class="code-block-extention-head-left button">'
      +        '<svg></svg>'
      +      '</div>'
      +      '<div class="code-block-extention-head-right">'
      +        '<span class="code-block-extention-lang">javascript</span>'
      +        '<span class="code-block-extension-copyCodeBtn button">Copy</span>'
      +      '</div>'
      +    '</div>'
      +    '<code class="hljs language-javascript">'
      +      '<span class="code-block-extention-codeline">hello\nworld</span>'
      +    '</code>'
      +   '</pre>'
      + '</div>'
    ;
    testPreCodeWithButtons(html);
  }


  function testPreCodeWithBlankComponent(html) {
    it("remove blank component", () => {
      const {doc, node} = DOMTool.parseHTML(win, html);
      let contextNode = node;
      contextNode = mdPlugin.handle(doc, contextNode);
      const components = contextNode.querySelectorAll('.component')
      H.assertEqual(components.length, 0);
      const code = contextNode.querySelector('code');
      H.assertNotEqual(code, null);
      H.assertEqual(code.textContent, 'code text')
    });
  }

  {
    const html = `
      <pre>
        <span class="component"></span>
        <code>code text</code>
        <span class="component"></span>
      </pre>
    `;
    testPreCodeWithBlankComponent(html);
  }



  // ============================================================
  // code with line number
  // ============================================================

  function testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector) {
    it("handle code with line number > " + desc, () => {
      const {doc, node} = DOMTool.parseHTML(win, html);
      let contextNode = node;
      contextNode = mdPlugin.handle(doc, contextNode);
      const lineNumberNodes = contextNode.querySelectorAll(lineNumberSelector);
      H.assertEqual(lineNumberNodes.length, 0)

      const codeNode = contextNode.querySelector('code');
      const code = codeNode.textContent;
      H.assertEqual(codeNode.getAttribute('class'), ['language', language].join('-'));
      const lines = code.split(/\n/);
      H.assertEqual(lines.length, 3);

      const [line1, line2, line3] = lines;
      H.assertMatch(line1, /line 1/);
      H.assertMatch(line2, /line 2/);
      H.assertMatch(line3, /line 3/);
    });
  }



  {
    // get from que01.github.io
    const desc = "code table with gutter and code A";
    const language = "javascript";
    const lineNumberSelector = ".gutter .line";
    const html = `
      <figure class="highlight javascript">
      <table><tbody>
        <tr>
          <td class="gutter">
            <pre>
              <span class="line">1</span>
              <br>
              <span class="line">2</span>
              <br>
              <span class="line">3</span>
              <br>
            </pre>
          </td>
          <td class="code">
            <pre>
              <span class="line"><span>line</span> 1</span>
              <br>
              <span class="line">line <span>2</span></span>
              <br>
              <span class="line"><span>line 3</span></span>
              <br>
            </pre>
          </td>
        </tr>
      </tbody></table>
      </figure>
    `;
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }


  {

    // get from http://gavinmiller.io
    const desc = "code table with gutter and code B";
    const language = "ruby";
    const lineNumberSelector  = ".line-number";
    const html = `
      <figure class="code">
        <div class="highlight">
          <table><tbody>
            <tr>
              <td class="gutter">
                <pre class="line-numbers">
                  <span class="line-number">1</span>
                  <span class="line-number">2</span>
                  <span class="line-number">3</span>
                </pre>
              </td>
              <td class="code">
                <pre>
                  <code class="ruby">
                    <span class="line"><span>line 1</span></span>
                    <span class="line"><span>line</span> 2</span>
                    <span class="line">line <span>3</span></span>
                  </code>
                </pre>
              </td>
            </tr>
          </tbody></table>
        </div>
      </figure>
    `;
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }



  {
    // get from jquery doc (Zeal)
    const desc = "code tabble with gutter and code C";
    const language = "python";
    const lineNumberSelector  = ".line";
    const html = `
      <div class="syntaxhighlighter python">
        <table><tbody>
          <tr>
            <td class="gutter">
              <div class="line n1">1</div>
              <div class="line n2">2</div>
              <div class="line n3">3</div>
            </td>
            <td class="code">
              <pre>
                <div class="container">
                  <div class="line">
                    <code><span>line 1<span></code>
                  </div>
                </div>
                <div class="container">
                  <div class="line">
                    <code>line 2</code>
                  </div>
                </div>
                <div class="container">
                  <div class="line">
                    <code>line 3</code>
                  </div>
                </div>
              </pre>
            </td>
          </tr>
        </tbody></table>
      </div>
    `;
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }



  {
    // get from gist.github.io
    const desc = "code table of gist";
    const language = "c";
    const lineNumberSelector = ".js-line-number"
    const html = `
      <div class="Box-body p-0 blob-wrapper data type-c">
        <table class="highlight">
          <tbody>
            <tr>
              <td class="blob-num js-line-number" data-line-number="1"></td>
              <td class="blob-code blob-code-inner js-file-line"><span>
              line</span> 1</td>
            </tr>
            <tr>
              <td class="blob-num js-line-number" data-line-number="2"></td>
              <td class="blob-code blob-code-inner js-file-line">line <span>2</span></td>
            </tr>
            <tr>
              <td class="blob-num js-line-number" data-line-number="3"></td>
              <td class="blob-code blob-code-inner js-file-line"><span>line 3</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }



  {
    // get from gitlab.com
    const desc = "code div of Gitlab";
    const language = "yaml";
    const lineNumberSelector = '.line-numbers .diff-line-num';
    const html = `
      <div class="file-content code js-syntax-highlight">
        <div class="line-numbers">
          <a id = "L1" class="diff-line-num" data-line-number="1">1</a>
          <a id = "L2" class="diff-line-num" data-line-number="2">2</a>
          <a id = "L3" class="diff-line-num" data-line-number="3">3</a>
        </div>
        <div class="blob-content">
          <pre class="highlight">
            <code>
              <span id="LC1" class="line" lang="yaml"><span>line</span> 1</span>
              <span id="LC2" class="line" lang="yaml"><span>line</span> 2</span>
              <span id="LC3" class="line" lang="yaml"><span>line</span> 3</span>
            </code>
          </pre>
        </div>
      </div>
    `;
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }



  {
    const desc = "line numbers are behind code block";
    const language = "js";
    const lineNumberSelector = ".line-num";
    const html = `
      <div class="highlight">
        <div class="code">
          <pre>
              <span class="line" lang="js"><span>line</span> 1</span>
              <span class="line" lang="html"><span>line</span> 2</span>
              <span class="line" lang="js"><span>line</span> 3</span>
          </pre>
        </div>
        <div class="line-numbers">
          <a class="line-num" data-line-number="1"></a>
          <a class="line-num" data-line-number="2"></a>
          <a class="line-num" data-line-number="3">

          </a>
        </div>
      </div>
    `;
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }



  {
    // https://www.jianshu.com/p/5ec142a5fd8c
    const desc = "line numbers are inside code node";
    const language = "bash";
    const lineNumberSelector = '.line-numbers-row span';
    const html = (
      `<div><pre class="line-numbers  language-bash">`
    +   `<code class="language-bash">`
    +     `line 1\n`
    +     `line 2\n`
    +     `line 3`
    +     `<span aria-hidden="true" class="line-numbers-rows">`
    +       `<span></span>`
    +       `<span></span>`
    +       `<span></span>`
    +     `</span>`
    +   `</code>`
    + `</pre></div>`);
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }



  {
    // https://blog.csdn.net/vanjoge/article/details/79657874
    const desc = "line numbers are groupped with code line by line"
    const language = "perl"
    const lineNumberSelector = ".hljs-ln-numbers .hljs-ln-n";
    const html = `
      <pre class="has" name="code">
        <code class="language-perl">
          <ol class="hljs-ln">
            <li>
              <div class="hljs-ln-numbers">
                <div class="hljs-ln-line hljs-ln-n" data-line-number="1"></div>
              </div>
              <div class="hljs-ln-code">
                <div class="hljs-ln-line">line 1</div>
              </div>
            </li>
            <li>
              <div class="hljs-ln-numbers">
                <div class="hljs-ln-line hljs-ln-n" data-line-number="2"></div>
              </div>
              <div class="hljs-ln-code">
                <div class="hljs-ln-line">line 2</div>
              </div>
            </li>
            <li>
              <div class="hljs-ln-numbers">
                <div class="hljs-ln-line hljs-ln-n" data-line-number="3"></div>
              </div>
              <div class="hljs-ln-code">
                <div class="hljs-ln-line">line 3</div>
              </div>
            </li>
          </ol>
        </code>
      </pre>
    `;
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }





  {
    // https://doc.ruoyi.vip/ruoyi-cloud/cloud/gateway.html#%E4%BD%BF%20%20%20%20%E7%94%A8%E7%BD%91%E5%85%B3
    const desc = "code div that has class like language-*";
    const language = "xml";
    const lineNumberSelector = ".line-number";
    const html = (
      `<div class="language-xml line-numbers-mode target">`
    +   `<pre class="language-xml">`
    +      `<code>`
    +         `<span class="token comment">line 1</span>\n`
    +         `<span class="token tag">line</span>`
    +         `<span class="token number"> 2</span>\n`
    +         `<span class="token tag"><span class="token keyword">line</span> 3</span>\n`
    +      `</code>`
    +   `</pre>`
    +   `<div class="line-numbers-wrapper">`
    +     `<span class="line-number">1  </span>`
    +     `<br>`
    +     `<span class="line-number">2  </span>`
    +     `<br>`
    +     `<span class="line-number">3  </span>`
    +     `<br>`
    +   `</div>`
    + `</div>`
    );
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }



  {
    // https://doc.ruoyi.vip/ruoyi-cloud/cloud/gateway.html#%E4%BD%BF%20%20%20%20%E7%94%A8%E7%BD%91%E5%85%B3
    const desc = "code div that has highlight-lines";
    const language = "lua";
    const lineNumberSelector = ".line-number";
    const html = (
      `<div class="language-lua line-numbers-mode target">`
    +   `<div class="highlight-lines">`
    +      `<br>`
    +      `<div class="highlighted"></div>`
    +      `<br>`
    +   `</div>`
    +   `<pre class="language-lua">`
    +      `<code>`
    +         `<span class="token comment">line 1</span>\n`
    +         `<span class="token tag">line</span>`
    +         `<span class="token number"> 2</span>\n`
    +         `<span class="token tag"><span class="token keyword">line</span> 3</span>\n`
    +      `</code>`
    +   `</pre>`
    +   `<div class="line-numbers-wrapper">`
    +     `<span class="line-number">1  </span>`
    +     `<br>`
    +     `<span class="line-number">2  </span>`
    +     `<br>`
    +     `<span class="line-number">3  </span>`
    +     `<br>`
    +   `</div>`
    + `</div>`
    );
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }


  {
    // https://time.geekbang.org/column/article/381193
    const desc = "code div that is contains code-language in other attribute than class";
    const language = "bash";
    const lineNumberSelector = "[data-code-line-number]";
    const html = (
      `<div>`
      + `<div class="klassContainer" data-code-language="bash">`
      +   `<div class="klassBtn"><span></span></div>`
      +   `<div class="klassB">`
      +     `<div class="NA NB" data-code-line-number="1"></div>`
      +     `<div class="NA NB" data-code-line-number="2"></div>`
      +     `<div class="NA NB" data-code-line-number="3"></div>`
      +   `</div>`
      +   `<div class="se-97c4f043">`
      +     `<div data-simplebar="init">`
      +       `<div class="simplebar-wrapper">`
      +         `<div class="simplebar-height-auto-observer-wrapper">`
      +           `<div class="simplebar-height-auto-observer"></div>`
      +         `</div>`
      +         `<div class="simplebar-mask">`
      +           `<div class="simplebar-offset">`
      +             `<div class="simplebar-content-wrapper">`
      +               `<div class="simplebar-content">`
      +                 `<div data-origin="pm_code_preview">`
      +                   `<div class="LA LB" data-slate-type="code-line">line 1</div>`
      +                   `<div class="LA LB" data-slate-type="code-line">line 2</div>`
      +                   `<div class="LA LB" data-slate-type="code-line">line 3</div>`
      +                 `</div>`
      +               `</div>`
      +             `</div>`
      +           `</div>`
      +         `</div>`
      +         `<div class="simplebar-placeholder"></div>`
      +       `</div>`
      +       `<div class="simplebar-track simplebar-horizontal">`
      +         `<div class="simplebar-scrollbar"></div>`
      +       `</div>`
      +       `<div class="simplebar-track simplebar-vertical">`
      +         `<div class="simplebar-scrollbar"></div>`
      +       `</div>`
      +     `</div>`
      +   `</div>`
      + `</div>`
      +`</div>`
    );
    testHandleCodeWithLineNumber(desc, html, language, lineNumberSelector);
  }


  const normalTable_A = `
    <div class="highlight">
      <table>
        <tbody>
          <tr><td>1</td><td>foo</td></tr>
          <tr><td>2</td><td>bar</td></tr>
          <tr><td>3</td><td>baz</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const normalTable_B = `
    <div class="highlight">
      <table>
        <tbody>
          <tr><td class="id">1</td><td>foo</td></tr>
          <tr><td class="id">2</td><td>bar</td></tr>
          <tr><td class="id">3</td><td>baz</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const normalTable_C = `
    <div class="highlight">
      <table>
        <tbody>
          <tr><td class="id line">1</td><td>foo</td></tr>
          <tr><td class="id line"><span>2</span></td><td>bar</td></tr>
          <tr><td class="id line">3</td><td>baz</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const normalTable_Z = `
    <div class="whatever">
      <table>
        <tbody>
          <tr><td class="id line">1</td><td>foo</td></tr>
          <tr><td class="id line"><span>2</span></td><td>bar</td></tr>
          <tr><td class="id line">3</td><td>baz</td></tr>
        </tbody>
      </table>
    </div>
  `;

  const normalDiv_A = `
    <div class="highlight">
      <div>
        <p class="id">1</p>
        <p class="id">2</p>
        <p class="id">3</p>
      </div>
      <div>
        <p>foo</p>
        <p>bar</p>
        <p>baz</p>
      </div>
    </div>
  `;

  const normalDiv_B = `
    <div class="highlight">
      <div>
        <p class="id line">1</p>
        <p class="id line">2</p>
        <p class="id line">3</p>
      </div>
      <div>
        <p>foo</p>
        <p>bar</p>
      </div>
    </div>
  `;

  const normalDiv_Z = `
    <div class="whatever">
      <div>
        <p class="id line">1</p>
        <p class="id line">2</p>
        <p class="id line">3</p>
      </div>
      <div>
        <p>foo</p>
        <p>bar</p>
        <p>baz</p>
      </div>
    </div>
  `

  function testHandleNormalTable(name, html) {
    it("handle normal table " + name, () => {
      const {doc, node} = DOMTool.parseHTML(win, html);
      let contextNode = node;
      contextNode = mdPlugin.handle(doc, contextNode);
      const table = contextNode.querySelector('table');
      H.assertNotEqual(table, null);
    });
  }

  function testHandleNormalDiv(name, html) {
    it("handle normal div " + name, () => {
      const {doc, node} = DOMTool.parseHTML(win, html);
      let contextNode = node;
      contextNode = mdPlugin.handle(doc, contextNode);
      const pre = contextNode.querySelector('pre');
      H.assertEqual(pre, null);
    });
  }


  testHandleNormalTable('A ~ without line number keyword', normalTable_A);
  testHandleNormalTable('B ~ without line number keyword', normalTable_B);
  testHandleNormalTable('C ~ node has child', normalTable_C);
  testHandleNormalTable('Z ~ without keyword', normalTable_Z);

  testHandleNormalDiv('A ~ without line number keyword', normalDiv_A);
  testHandleNormalDiv('B ~ the number of node is not equal', normalDiv_B);
  testHandleNormalDiv('Z ~ without keyword', normalDiv_Z);

  // get from rubyOnRails (Zeal)
  const codeTable_without_line_number = `
    <div class="code-container">
      <div>
        <div class="syntaxhighlighter nogutter ruby">
          <table><tbody>
            <tr>
              <td class="code">
                <div class="container">
                  <div class="line number1 index0"><code>line 1</code></div>
                  <div class="line number2 index1"><code>line</code> <code>2</code></div>
                  <div class="line number3 index2">line <code>3</code></div>
                </div>
              </td>
            </tr>
          </tbody></table>
        </div>
      </div>
    </div>
  `;

  function testHandleCodeTableWithoutLineNumber(name, html) {
    it("handle code table without line number" + name, () => {
      const {doc, node} = DOMTool.parseHTML(win, html);
      let contextNode = node;
      contextNode = mdPlugin.handle(doc, contextNode);
      const table = contextNode.querySelector('table');
      H.assertEqual(table, null);
      const preNode = contextNode.querySelector('pre');
      const codeNode = preNode.children[0];
      H.assertMatch(codeNode.getAttribute('class'), /language-/);
    });
  }

  testHandleCodeTableWithoutLineNumber("rubyOnRails", codeTable_without_line_number);



  //
  //  `<div><pre class="brush:java;toolbar: true; auto-links: false;">`
  //


});
