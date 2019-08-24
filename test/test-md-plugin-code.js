const H = require('./helper.js');
const DOMTool = H.depJs('lib/dom-tool.js');
const mdPlugin = H.depJs('lib/md-plugin-code.js');

describe('MdPluginCode', () => {

  it('fix linebreak (convert <br> to linebreak)', () => {
    const html = `<pre>code<br />text</pre>`;
    const {doc, node: contextNode} = DOMTool.parseHTML(html);
    const node = mdPlugin.handle(doc, contextNode);
    H.assertMatch(node.textContent, /^code\ntext$/);
  });


  function testGetLanguageFromNode(html, language) {
    it('get language from node ' + language, () => {
      let {doc, node: contextNode} = DOMTool.parseHTML(html);
      contextNode = mdPlugin.handle(doc, contextNode);
      const node = contextNode.querySelector('pre');
      H.assertNotEqual(node, null);
      const child = node.children[0];
      H.assertEqual(child.tagName, 'CODE');
      H.assertEqual(child.getAttribute('class'), ['language', language].join('-'));
    });
  }

  testGetLanguageFromNode(`<div><pre>code text</pre></div>`, 'plain');

  testGetLanguageFromNode(`
    <div>
      <pre class="lang-javascript">
        code text
      </pre>
    </div>
  `, 'javascript');

  testGetLanguageFromNode(`
    <div>
      <pre class="lang-javascript">

        <code class="shell">
          code text
        </code>
      </pre>
    </div>
  `, 'shell');

  testGetLanguageFromNode(`
      <div class="language-ruby highlight">
        <div class="highlight">
          <pre class="highlight">code text</pre>
        </div>
      </div>
  `, 'ruby');

  it('merge <pre> lines', () => {
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
    const {doc, node} = DOMTool.parseHTML(html);
    let contextNode = node;
    contextNode = mdPlugin.handle(doc, contextNode);
    const nodesA = contextNode.querySelectorAll('.will-merge pre');
    const nodesB = contextNode.querySelectorAll('.will-not-merge pre');
    H.assertEqual(nodesA.length, 1);
    H.assertEqual(nodesB.length, 2);
  });

  it('Using block element as code line', () => {
    // get from Load-Dash (Zeal)
    const html = (`
      <div class="highlight js">
        <pre>
          <div><span>line 1</span></div>
          <div><span>line</span> 2</div>
          <div>line <span>3</span></div>
        </pre>
      </div>
    `).replace(/^\s+/mg, '').replace(/\s+$/mg, '').replace(/\n/mg, '');

    const {doc, node} = DOMTool.parseHTML(html);
    let contextNode = node;
    contextNode = mdPlugin.handle(doc, contextNode);
    const code = contextNode.querySelector('code').textContent;
    const matches = code.match(/\n/mg);
    H.assertNotEqual(matches, null);
    H.assertEqual(matches.length, 2);
  });

  // get from que01.github.io
  const codeTable_gutterAndCode_A = `
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

  // get from http://gavinmiller.io
  const codeTable_gutterAndCode_B = `
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

  // get from jquery doc (Zeal)
  const codeTable_gutterAndCode_C = `
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

  // get from gist.github.io
  const codeTable_gist = `
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

  // get from gitlab.com
  const codeDiv_gitlab = `
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

  // lineNumbers are beghind codes
  const codeDiv_A = `
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

  function testHandleCodeWithLineNumber(html, language) {
    it("handle code with line number " + language, () => {
      const {doc, node} = DOMTool.parseHTML(html);
      let contextNode = node;
      contextNode = mdPlugin.handle(doc, contextNode);
      const codeNode = contextNode.querySelector('code');
      const code = codeNode.textContent;
      H.assertEqual(codeNode.getAttribute('class'), ['language', language].join('-'));
      const [line1, line2, line3] = code.split(/\n/);
      H.assertMatch(line1, /line 1/);
      H.assertMatch(line2, /line 2/);
      H.assertMatch(line3, /line 3/);
    });
  }

  testHandleCodeWithLineNumber(codeTable_gutterAndCode_A, 'javascript');
  testHandleCodeWithLineNumber(codeTable_gutterAndCode_B, 'ruby');
  testHandleCodeWithLineNumber(codeTable_gutterAndCode_C, 'python');
  testHandleCodeWithLineNumber(codeTable_gist, 'c');
  testHandleCodeWithLineNumber(codeDiv_gitlab, 'yaml');
  testHandleCodeWithLineNumber(codeDiv_A, 'js');

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
      const {doc, node} = DOMTool.parseHTML(html);
      let contextNode = node;
      contextNode = mdPlugin.handle(doc, contextNode);
      const table = contextNode.querySelector('table');
      H.assertNotEqual(table, null);
    });
  }

  function testHandleNormalDiv(name, html) {
    it("handle normal div " + name, () => {
      const {doc, node} = DOMTool.parseHTML(html);
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

});
