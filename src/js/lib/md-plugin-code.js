;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('./log.js'),
      require('./tool.js'),
      require('./dom-tool.js')
    );
  } else {
    // browser or other
    root.MxWcMdPluginCode = factory(
      root.MxWcLog,
      root.MxWcTool,
      root.MxWcDOMTool,
    );
  }
})(this, function(Log, T, DOMTool, undefined) {
  "use strict";

  //
  // 1. handle <table>
  //
  // 2. handle <div>
  //
  // 3. handle <pre>
  //
  // 4. handle <code>?
  //

  const KEYWORDS = ['highlight', 'syntax', 'code'];
  const DEFAULT_LANGUAGE = 'plain';

  function handle(doc, contextNode) {
    contextNode = handleTableNodes(doc, contextNode);
    contextNode = handleDivNodes(doc, contextNode);
    contextNode = handlePreNodes(contextNode);
    contextNode = handleCodeNodes(contextNode);
    return contextNode;
  }

  function handleTableNodes(doc, contextNode) {
    const nodes = DOMTool.querySelectorIncludeSelf(contextNode, 'table');
    [].forEach.call(nodes, (node) => {
      const wrapper = getCodeWrapper(node);
      if (wrapper) {
        if (contextNode === wrapper) {
          contextNode = handleCodeWrapper(doc, wrapper);
        } else {
          handleCodeWrapper(doc, wrapper);
        }
      }
    });
    return contextNode;
  }

  function handleDivNodes(doc, contextNode) {
    const wrappers = new Set();
    for(let i = 0; i < KEYWORDS.length; i++) {
      const selector = `div[class*=${KEYWORDS[i]}]`;
      const nodes = DOMTool.querySelectorIncludeSelf(contextNode, selector);
      [].forEach.call(nodes, (node) => {
        const wrapper = getCodeWrapper(node);
        wrappers.add(wrapper);
      });
    }

    wrappers.forEach((wrapper) => {
      if (contextNode === wrapper) {
        contextNode = handleCodeWrapper(doc, wrapper);
      } else {
        handleCodeWrapper(doc, wrapper);
      }
    });
    return contextNode;
  }

  function handleCodeWrapper(doc, wrapper) {
    const paths = groupLeafNode(wrapper);
    if (paths.length === 2) {
      // probally is code (with line numbers)
      const [pathA, pathB] = paths;

      const score = calcLineNumberScore(wrapper, pathA);
      const isLineNumber = score >= 2;

      if (isLineNumber) {
        const codeLines = [];
        const counter = T.createCounter();
        [].forEach.call(wrapper.querySelectorAll(pathB), (node) => {
          const lang = node.getAttribute('lang');
          if (lang) { counter.count(lang); }
          codeLines.push(node.textContent.replace(/\n+/mg, ''));
        });
        const code = codeLines.join('\n');

        let language;
        const languageFromCodeLine = getLanguageByName(counter.max());
        if (languageFromCodeLine) {
          language = languageFromCodeLine;
        } else {
          const klasses = path2klasses(pathB).reverse();
          const languageFromPath = getLanguageByKlasses(klasses);
          if (languageFromPath) {
            language = languageFromPath;
          } else {
            language = getLanguageFromNearNodes(wrapper, 0, 1, 2) || DEFAULT_LANGUAGE;
          }
        }

        const klass = toTurndownLanguageClass(language);
        const newNode = doc.createElement('div');
        newNode.innerHTML = `<pre><code class="${klass}">${T.escapeHtml(code)}</code></pre>`;

        const pNode = wrapper.parentNode;
        if (pNode) {
          pNode.insertBefore(newNode, wrapper);
          pNode.removeChild(wrapper);
          return newNode;
        } else {
          Log.error("Parent node is empty");
        }
      } else {
        Log.debug("Not a line number");
      }
    }
    return wrapper;
  }

  function calcLineNumberScore(wrapper, path) {
    let score = 0;
    if (path.match(/line-num/)) {
      score++;
    } else if (path.match(/line/)) {
      score++;
    }
    if (path.match(/gutter/)) {score++}

    const nodes = wrapper.querySelectorAll(path);
    let allNodeHaveDataLineNumAttr = true;
    let allNodeHaveLineNumberText = true;

    [].forEach.call(nodes, (node, idx) => {
      if (!(node.hasAttribute('data-line-number') || node.hasAttribute('data-line-num'))) {
        allNodeHaveDataLineNumAttr = false;
      }

      const text = node.textContent;
      if (!(text.match(/^\s*\d+\s*$/) && parseInt(text) === idx + 1)) {
        allNodeHaveLineNumberText = false;
      }
    });

    if (allNodeHaveDataLineNumAttr) {score++}
    if (allNodeHaveLineNumberText) {score++}
    return score;
  }

  function path2klasses(path) {
    const arr = [];
    path.split('>').forEach((it) => {
      const idx = it.indexOf('.');
      if (idx > -1) {
        arr.push(...it.substring(idx).split('.'));
      }
    })
    return arr;
  }

  function getCodeWrapper(node) {
    const nodes = getNearNodesByRange(node, 0, 1, 2, 3);
    let wrapper = null;
    for (let i = 0; i < nodes.length; i++) {
      const currNode = nodes[i];

      for(let j = 0; j < KEYWORDS.length; j++) {
        const selector = `[class*=${KEYWORDS[j]}]`;
        if (currNode.matches(selector)) {
          wrapper = currNode;
          break;
        }
      }
    }
    return wrapper;
  }

  function node2Str(node) {
    const arr = [];
    arr.push(node.tagName.toLowerCase());
    const klass = node.getAttribute('class');
    if (klass) {
      klass.split(/\s+/).forEach((it) => {
        if (it.match(/\d+$/) || it === '') {
        } else {
          arr.push(it);
        }
      });
    }
    return arr.join('.');
  }

  function groupLeafNode(node) {
    const dict = {}
    const SEPARATOR = '>';
    const rootNodeStr = node2Str(node);
    dict[rootNodeStr] = [];

    flattenNode(node, [], (leafPath) => {
      leafPath.shift(); // remove rootNodeStr
      dict[rootNodeStr].push(leafPath);
    });

    while(true) {
      let allGroupEmpty = true;
      for (let k in dict) {
        if (dict[k].length > 0) {
          allGroupEmpty = false;
          break;
        }
      }

      if (allGroupEmpty) {
        break;
      }
      for (let k in dict) {
        const group = dict[k];
        if (group.length > 0) {


          let tmpDict = {}
          let anyLeafPathReachEnd = false;

          for (let j = 0; j < group.length; j++) {
            const leafPath = group[j];
            if (leafPath.length > 0) {
              const nodeStr = leafPath.shift();
              const newKey = [k, nodeStr].join(SEPARATOR);
              tmpDict[newKey] = tmpDict[newKey] || [];
              tmpDict[newKey].push(leafPath);
            } else {
              anyLeafPathReachEnd = true;
              break;
            }
          }

          if (anyLeafPathReachEnd) {
            dict[k] = [];
          } else {
            delete dict[k];
            Object.assign(dict, tmpDict);
          }
          tmpDict = undefined;

        }
      }
    }

    const keys = [];
    for(let key in dict) {
      const idx = key.indexOf(SEPARATOR);
      keys.push(key.substring(idx + SEPARATOR.length));
    }
    return keys;
  }

  // TODO This function is slow
  function flattenNode(node, result, fn) {
    const count = countChildrenByNodeType(node);

    if (count.textNode === 0 && count.elementNode === 1) {
      // has only one child
      result.push(node2Str(node));
      flattenNode(node.children[0], result, fn);
    } else if (count.textNode === 0 && count.otherNode === 0 && count.elementNode > 0) {

      const nodeStr = node2Str(node);
      [].forEach.call(node.children, (child) => {
        const newResult = [...result];
        newResult.push(nodeStr);
        flattenNode(child, newResult, fn);
      });
    } else {
      if (['br'].indexOf(node.tagName.toLowerCase()) > -1) {
      } else {
        result.push(node2Str(node));
        fn(result);
      }
    }
  }


  function handleCodeNodes(contextNode) {
    // Should we handle code node?
    return contextNode;
  }

  function handlePreNodes(contextNode) {
    const nodes = DOMTool.querySelectorIncludeSelf(contextNode, 'pre');
    [].forEach.call(nodes, (node) => {
      const language = getLanguageFromNearNodes(node, -1, 0, 1, 2);
      const klass = toTurndownLanguageClass(language);

      if (hasOnlyOneChild(node)) {
        const child = node.children[0];
        if (child.tagName === 'CODE') {
          //<pre><code>...</code></pre>
          child.setAttribute('class', klass);
          fixLineBreak(child);
        } else {
          fixLineBreak(node);
          node = toCommonStructure(node, klass);
        }
      } else {
        fixLineBreak(node);
        node = toCommonStructure(node, klass);
      }
    });
    return contextNode;
  }

  function toCommonStructure(node, klass) {
    node.innerHTML = `<code class="${klass}">${node.innerHTML}</code>`;
    return node;
  }

  function fixLineBreak(node) {
    // convert <br> to "\n"
    node.innerHTML = node.innerHTML.replace(/<br\s{0,1}\/{0,1}>/img, "\n");
    return node;
  }


  function toTurndownLanguageClass(language) {
    return ['language', language].join('-');
  }


  function getLanguageFromNearNodes(node, ...range) {
    const nodes = getNearNodesByRange(node, ...range);
    return getLanguageFromNodes(nodes);
  }

  function getLanguageFromNodes(nodes) {
    for (let i = 0; i < nodes.length; i ++) {
      const language = getLanguageByKlassStr(nodes[i].getAttribute('class'));
      if (language) {
        return language;
      }
    }
    return DEFAULT_LANGUAGE;
  }


  /**
   * @param {Node} node - current node
   * @param {Enum} range - range of offset to current node,
   *   It must includes zero.
   *   It must from small offset to big offset.
   */
  function getNearNodesByRange(node, ...range) {
    const arr = [node];
    const idx = range.indexOf(0);

    // handle positive offset
    let currNode = node;
    for (let i = idx + 1; i < range.length; i++) {
      if (currNode.parentNode && hasOnlyOneChild(currNode.parentNode)) {
        currNode = currNode.parentNode;
        arr.push(currNode);
      } else {
        break;
      }
    }

    // handle nagative offset
    currNode = node;
    for (let i = 0; i < idx; i++) {
      if (hasOnlyOneChild(currNode)) {
        currNode = currNode.children[0];
        arr.unshift(currNode);
      } else {
        break;
      }
    }

    return arr;
  }


  function hasOnlyOneChild(node) {
    const count = countChildrenByNodeType(node);
    return count.textNode === 0 && count.elementNode === 1;
  }

  function countChildrenByNodeType(node) {
    let elementNode = 0, textNode = 0, otherNode = 0;
    for(let i = 0; i < node.childNodes.length; i++) {
      switch(node.childNodes[i].nodeType) {
        case 1: elementNode++; break;
        case 3:
          if(!node.textContent.match(/^\s*$/m)) {
            // not blank text node
            textNode++;
          }
          break;
        default:
          otherNode++;
          break;
      }
    }
    return {elementNode, textNode, otherNode}
  }

  function getLanguageByKlassStr(klassStr) {
    if (!klassStr) {return null}
    let input = klassStr.trim();
    if (input.length === 0) { return null}

    const klasses = input.split(/\s+/);
    return getLanguageByKlasses(klasses);
  }

  function getLanguageByKlasses(klasses) {
    const regExps = [
      /^lang-(.+)$/i,
      /^language-(.+)$/i,
      /^type-(.+)$/i,
      /^highlight-(.+)$/i,
    ];

    for (let i = 0; i < klasses.length; i++) {
      const klass = klasses[i];
      for (let j = 0; j < regExps.length; j ++) {
        const regExp = regExps[j];
        const matchResult = klass.match(regExp);
        if (matchResult) {
          return matchResult[1];
        }
      }

      // Cann't match regExp, try match language names
      const lang = getLanguageByName(klass);
      if (lang) {
        return lang;
      }
    }

    return null;
  }

  function getLanguageByName(name) {
    if(!name) { return null }
    const idx = LANGUAGE_NAMES.indexOf(name.toLowerCase());
    return idx > -1 ? LANGUAGE_NAMES[idx] : null;
  }

  // FIXME enhance me
  const LANGUAGE_NAMES = (`Plain
    Text
    ABCL
    ActionScript
    Afnix
    Ada
    APL
    AppleScript
    ASP
    ALGOL
    ALF
    AutoIt
    Automake
    Agora
    awk
    BASIC
    BETA
    BennuGD
    BeanShell
    BibTex
    Boo
    Bliss
    C
    C#
    C++
    ChangeLog
    Charity
    Cecil
    Chuck
    Cilk
    Curry
    Clean
    CLEO
    CLIST
    CMake
    Cobra
    COBOL
    ColdFusion
    CoffeeScript
    CSS
    CSV
    CUDA
    Curl
    D
    DASL
    DIBOL
    E
    Eiffel
    Erlang
    Elixir
    F#
    Forth
    Fortran
    Frink
    Fril
    F-Script
    Go
    Haskell
    HTML
    Haml
    HyperTalk
    IDL
    ICI
    IO
    J
    Jade
    Java
    JavaScript
    Js
    Janus
    JASS
    Joy
    JOVIAL
    Joule
    JSON
    Julia
    Kite
    Lava
    LaTex
    Lex
    Leda
    Lisp
    Limbo
    Lisaac
    Lua
    M
    ML
    Makefile
    Markdown
    Matlab
    MEL
    Modula-2
    Mondrian
    MOO
    Moto
    MATLAB
    Nemerle
    Objective-C
    Objective-J
    Oberon
    Obliq
    Occam
    OpenGL
    OPAL
    OPS5
    Oxygene
    Oz
    Pascal
    PCASTL
    Perl
    PostScript
    PHP
    Pict
    Pig
    Pliant
    Poplog
    Prolog
    Protobuf
    Prograph
    Python
    Python3
    Q
    R
    Rapira
    REXX
    REBOL
    Revolution
    Ruby
    Rust
    RPG
    ROOP
    SALSA
    Scala
    Scheme
    Scilab
    Self
    SGML
    SMALL
    Smalltalk
    sh
    shell
    S-Lang
    Slate
    Spin
    SQL
    SR
    Tcl
    Turing
    VB
    VBScript
    Visual Basic
    Visual FoxPro
    XL
    XML
    XHTML
    XOTcl
    YAML
  `).split(/\n+/).map((it) => {
    return it.trim().replace(/\s+/, '-').toLowerCase()
  });

  return {
    handle: handle
  }
});
