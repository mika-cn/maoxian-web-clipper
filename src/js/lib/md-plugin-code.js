"use strict";

/**!
 * In this module, we try to preprocess code block in HTML,
 * convert it into the standard format. Which is more
 * easy for Turndown to convert.
 *
 * for example:
 *   <pre><code class="language-c">CODE TEXT</code><pre>
 *
 */

//
// 1. handle <table>
//
// 2. handle <div>
//
// 3. handle <pre>
//
// 4. handle <code>?
//

import Log     from './log.js';
import T       from './tool.js';
import DOMTool from './dom-tool.js';
import {sanitizeSelectorItem} from 'css-selector-generator/src/utilities-selectors.js'

const KEYWORDS = ['highlight', 'syntax', 'code'];
const DEFAULT_LANGUAGE = 'plain';

const state = {
  nodeTypeCounterCache: T.createArrayCache('reverselySeek'),
}

function handle(doc, contextNode) {
  contextNode = handleTableNodes(doc, contextNode);
  contextNode = handleDivNodes(doc, contextNode);
  contextNode = handlePreNodes(doc, contextNode);
  contextNode = handleCodeNodes(doc, contextNode);
  state.nodeTypeCounterCache.clear();
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
      if (!isDescendantOfPreNode(node)) {
        const wrapper = getCodeWrapper(node);
        wrappers.add(wrapper);
      }
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


function handleCodeWrapper(doc, wrapper, params = {}) {
  const paths = params.paths ? params.paths : groupLeafNode(wrapper);
  const {
    isCodeWithLineNumbers,
    isCodeWrappedByLine = false,
    codePath,
    codeNodes
  } = analyzeWrapper(wrapper, paths);

  if (isCodeWithLineNumbers) {
    return handleCodeLines(wrapper, codePath, codeNodes, doc);
  } else if (isCodeWrappedByLine) {
    return handleCodeLines(wrapper, codePath, codeNodes, doc);
  } else {
    Log.debug("CODE WRAPPER", paths);
  }
  return wrapper;
}

function analyzeWrapper(wrapper, paths) {
  const not = {
    isCodeWrappedByLine: false,
    isCodeWithLineNumbers: false,
  };

  if (paths.length === 1) {
    const [path] = paths;
    if (path.match(/code/i) && path.match(/line/i)) {
      const nodes = wrapper.querySelectorAll(path);
      return {
        isCodeWrappedByLine: true,
        isCodeWithLineNumbers: false,
        codePath: path,
        codeNodes: nodes,
      }
    }
    return not;
  } else if (paths.length === 2) {
    // probally is code (with line numbers)
    const [pathA, pathB] = paths;

    const pathA_nodes = wrapper.querySelectorAll(pathA);
    const pathB_nodes = wrapper.querySelectorAll(pathB);

    if (pathA_nodes.length !== pathB_nodes.length) {
      return not;
    }

    if (isLineNumber(pathA, pathA_nodes)) {
      return {
        isCodeWithLineNumbers: true,
        codePath: pathB,
        codeNodes: pathB_nodes
      }
    } else if (isLineNumber(pathB, pathB_nodes)) {
      return {
        isCodeWithLineNumbers: true,
        codePath: pathA,
        codeNodes: pathA_nodes
      }
    }
    return not;
  } else {
    return not;
  }

}

function isLineNumber(path, nodes) {
  let allNodeHaveDataLineNumAttr = true;
  let allNodeHaveLineNumberText = true;
  let allNodeHaveBlankText = true;
  let allNodeHaveNotChild = true;

  [].forEach.call(nodes, (node, idx) => {
    if (!(node.hasAttribute('data-line-number') || node.hasAttribute('data-line-num'))) {
      allNodeHaveDataLineNumAttr = false;
    }

    const text = node.textContent;
    if (!(text.match(/^\s*\d+\s*$/) && parseInt(text) === idx + 1)) {
      allNodeHaveLineNumberText = false;
    }

    if (!text.match(/^\s*$/)) {
      allNodeHaveBlankText = false;
    }

    if (node.children.length > 0) {
      allNodeHaveNotChild = false;
    }
  });

  if (!allNodeHaveNotChild) {return false}
  if (!(allNodeHaveLineNumberText || allNodeHaveBlankText)) {
    return false;
  }

  let score = 0;
  if (path.match(/line-num/i)) {
    score++;
  } else if (path.match(/line/i)) {
    score++;
  }
  if (path.match(/gutter/i)) {score++}
  if (allNodeHaveDataLineNumAttr) {score++}

  return score >= 1;
}

function handleCodeContainer(wrapper, codePath, codeNode, doc) {
  codeNode = fixLineBreak(codeNode);
  // browser ignore last line break inside <code>.
  const code = codeNode.textContent.replace(/\n$/, '');
  const language = getLanguageFromInside2Wrapper(wrapper, codePath);
  return renderCodeInWrapper(wrapper, code, language, doc);
}

function handleCodeLines(wrapper, codePath, codeNodes, doc) {
  const codeLines = [];
  const counter = T.createCounter();
  [].forEach.call(codeNodes, (node) => {
    const lang = node.getAttribute('lang');
    if (lang) { counter.count(lang); }
    codeLines.push(node2CodeLine(node));
  });
  const code = codeLines.join('\n');
  const language = getLanguageFromInside2Wrapper(wrapper, codePath, counter);
  return renderCodeInWrapper(wrapper, code, language, doc);
}

function renderCodeInWrapper(wrapper, code, language, doc) {
  const newNode = doc.createElement('div');
  const klass = Language.toTurndownKlass(language);
  newNode.innerHTML = `<pre data-mx-wc-processed><code class="${klass}">${T.escapeHtml(code)}</code></pre>`;

  const pNode = wrapper.parentNode;
  if (pNode) {
    pNode.replaceChild(newNode, wrapper);
    return newNode;
  } else {
    Log.error("Parent node is empty");
    return wrapper;
  }
}

function getLanguageFromInside2Wrapper(wrapper, codePath, counter) {
  let language, languageFromCodeLine;
  if (counter && counter.counted) {
    languageFromCodeLine = Language.getByName(counter.max());
  }
  if (languageFromCodeLine) {
    language = languageFromCodeLine;
  } else {
    const klasses = path2klasses(codePath).reverse();
    const languageFromPath = Language.getByKlasses(klasses);
    if (languageFromPath) {
      language = languageFromPath;
    } else {
      language = getLanguageFromNearNodes(wrapper, -1, 0, 1, 2) || DEFAULT_LANGUAGE;
    }
  }

  return language;
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

function node2CodeLine(node) {
  return node.textContent.replace(/\n+/mg, '');
}

function node2Str(node) {
  const arr = [];
  arr.push(node.tagName.toLowerCase());
  const klass = node.getAttribute('class');
  if (klass) {
    klass.trim().split(/\s+/).forEach((it) => {
      if (it.match(/\d+$/) || it === '') {
        // ends with number
      } else if (it.match(/^[,\.:\*"']/)) {
        // invalid klass
      } else {
        // sanitize it
        arr.push(sanitizeSelectorItem(it));
      }
    });
  }
  return arr.join('.');
}

function groupLeafNode(node) {
  const SEPARATOR = '>';

  const paths = flattenNodeNew(node);

  let currIdx = 1;
  const dict = { __ROOT__: paths }
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
        const codeNodeStrs = [];
        const spanNodeStrs = [];

        for (let j = 0; j < group.length; j++) {
          const leafPath = group[j];
          if (leafPath.length > 0) {
            const nodeStr = leafPath.shift();
            if (nodeStr.startsWith('code')) {
              codeNodeStrs.push(nodeStr);
            } else if (nodeStr.startsWith('span')) {
              spanNodeStrs.push(nodeStr);
            }

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
        } else if (codeNodeStrs.length === group.length
            && T.unique(codeNodeStrs).length > 1) {
          // new branch
          dict[k] = [];
        } else if (spanNodeStrs.length === group.length
            && T.unique(spanNodeStrs).length > 1) {
          // new branch
          dict[k] = [];
        }else {
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


function flattenNodeNew(node) {
  const queue = [node];
  const parentPaths = [[]]

  let currNode;
  let currPath;

  const paths = [];
  const blackList = ['BR', 'BUTTON'];

  while(currNode = queue.shift()) {
    currPath = parentPaths.shift();
    if (blackList.indexOf(currNode.tagName.toUpperCase()) > -1) {
      currPath = undefined;

    } else {
      const count = countChildrenByNodeType(currNode, {abortOnTextNode: true});

      if (count.textNode === 0 && count.elementNode === 1) {
        // has only one child
        currPath.push(node2Str(currNode));
        parentPaths.push([...currPath]);
        queue.push(currNode.children[0]);

      } else if (count.textNode === 0 && count.otherNode === 0 && count.elementNode > 0) {
        // children are all element node.
        currPath.push(node2Str(currNode));
        [].forEach.call(currNode.children, (child) => {
          parentPaths.push([...currPath]);
          queue.push(child);
        })

      } else {
        currPath.push(node2Str(currNode));
        paths.push(currPath);
      }
      currPath = undefined;
    }
  }

  return paths;
}

function handleCodeNodes(doc, contextNode) {
  // Should we handle code node?
  return contextNode;
}

function handlePreNodes(doc, contextNode) {
  const nodes = DOMTool.querySelectorIncludeSelf(contextNode, 'pre');
  const processedIndexes = [];
  for (let i = 0; i < nodes.length; i++) {

    if (processedIndexes.indexOf(i) === -1 && !nodes[i].hasAttribute('data-mx-wc-processed')) {
      let node = nodes[i];
      const klassStr = node.getAttribute('class');

      if (node !== contextNode
        && klassStr && klassStr.match(/line/i)
        && allChildrenAreAlike(node.parentNode)
      ) {


        // Programer using <pre> as a code line
        // We merge these lines.
        const codeLines = [];
        const counter = T.createCounter();
        [].forEach.call(node.parentNode.children, (it) => {
          const lang = node.getAttribute('lang');
          if (lang) { counter.count(lang); }
          codeLines.push(node2CodeLine(it));
          const index = [].indexOf.call(nodes, it);
          if (index > -1) { processedIndexes.push(index) }
        });
        const code = codeLines.join('\n');
        let language;
        const languageFromCodeLine = Language.getByName(counter.max());
        if (languageFromCodeLine) {
          language = languageFromCodeLine;
        } else {
          language = getLanguageFromNearNodes(node, 0, 1, 2, 3);
        }
        const isContextNode = (node.parentNode === contextNode);
        const newNode = renderCodeInWrapper(node.parentNode, code, language, doc);
        if(isContextNode) {contextNode = newNode}

      } else {

        const paths = groupLeafNode(node);
        const isContextNode = (node === contextNode);
        let newNode;
        if (paths.length === 1) {
          const [path] = paths;
          const codeNodes = [];
          if (path === node2Str(node)) {
            codeNodes.push(node);
          } else {
            codeNodes.push(...node.querySelectorAll(path));
          }

          if (codeNodes.length === 1) {
            newNode = handleCodeContainer(node, path, codeNodes[0], doc);
          } else {
            newNode = handleCodeLines(node, path, codeNodes, doc);
          }
        } else {
          newNode = handleCodeWrapper(doc, node, {paths});
        }

        if (isContextNode) {
          contextNode = newNode;
        }

      }

    }
  }
  return contextNode;
}

function allChildrenAreAlike(node) {
  const count = countChildrenByNodeType(node, {abortOnTextNode: true});

  if (count.textNode === 0 && count.otherNode === 0 && count.elementNode > 1) {
    const selector = node2Str(node.children[0]);
    return count.elementNode === node.querySelectorAll(selector).length;
  } else {
    return false;
  }
}

function fixLineBreak(node) {
  // convert <br> to "\n"
  node.innerHTML = node.innerHTML.replace(/<br\s{0,1}\/{0,1}>/img, "\n");
  return node;
}

function getLanguageFromNearNodes(node, ...range) {
  const nodes = getNearNodesByRange(node, ...range);
  return getLanguageFromNodes(nodes);
}

function getLanguageFromNodes(nodes) {
  for (let i = 0; i < nodes.length; i ++) {
    const language = Language.getByKlassStr(nodes[i].getAttribute('class'));
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
    if (currNode.parentNode
      && currNode.parentNode.tagName.toUpperCase() !== 'BODY'
      && hasOnlyOneChild(currNode.parentNode)
    ) {
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

function isDescendantOfPreNode(node) {
  let currNode = node;
  while (true) {
    if (currNode.parentNode) {
      if (currNode.parentNode.tagName.toUpperCase() === 'BODY') {
        return false
      }
      if (currNode.parentNode.tagName.toUpperCase() === 'PRE') {
        return true
      }
      currNode = currNode.parentNode;
    } else {
      return false
    }
  }
}



function hasOnlyOneChild(node) {
  const count = countChildrenByNodeType(node, {abortOnTextNode: true});
  return count.textNode === 0 && count.elementNode === 1;
}

function countChildrenByNodeType(node, {abortOnTextNode = false}) {
  return state.nodeTypeCounterCache.findOrCache(node, () => {
    let elementNode = 0, textNode = 0, otherNode = 0;
    for(let i = 0; i < node.childNodes.length; i++) {
      const nodeType = node.childNodes[i].nodeType;
      if (nodeType === 1) {
        elementNode++;
      } else if (nodeType === 3) {
        if(!node.childNodes[i].textContent.match(/^\s*$/)) {
          // not blank text node
          textNode++;
          if (abortOnTextNode) {
            break;
          }
        }
      } else {
        otherNode++;
      }
    }
    return {elementNode, textNode, otherNode}
  });
}

//=====================================
// Language
//=====================================

const Language = (function() {

  function toTurndownKlass(name) {
    return ['language', name].join('-');
  }

  function getByKlassStr(klassStr) {
    if (!klassStr) {return null}
    let input = klassStr.trim();
    if (input.length === 0) { return null}

    const klasses = input.split(/\s+/);
    return getByKlasses(klasses);
  }

  function getByKlasses(klasses) {
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
      const lang = getByName(klass);
      if (lang) {
        return lang;
      }
    }

    return null;
  }

  function getByName(name) {
    if(!name) { return null }
    const key = sanitizeName(name);
    return languageDict[key] ? key : null;
  }

  function sanitizeName(name) {
    return name.trim().replace(/\s+/, '-').toLowerCase();
  }

  // FIXME enhance me
  const LANGUAGE_NAMES_STR = (`Plain
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
  `);

  // init language dictionary
  const languageDict = {};
  LANGUAGE_NAMES_STR.split(/\n+/).forEach((it) => {
    languageDict[sanitizeName(it)] = true;
  });

  return {
    getByName,
    getByKlassStr,
    getByKlasses,
    toTurndownKlass,
  }
})();


const MdPluginCode = {
  handle: handle
}

export default MdPluginCode;
