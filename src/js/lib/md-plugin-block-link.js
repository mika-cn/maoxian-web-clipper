
/*!
 *
 * The problem:
 *
 * Block links which will be convertted by turndown to:
 *
 *    [
 *
 *    xxx
 *
 *    ](link.html)
 *
 * Which is not a valid markdown link.
 *
 * this plugin preprocess these block links to solve the problem.
 *
 * Because developers can use a block element as inline or otherwise,
 * We can't figure an element is block or not just by it's tag name.
 *
 * And we can't figure custom elements (treat as block element by default) too.
 *
 * So we depend on two MaoXian attribute:
 *
 *   - If a block element being used as inline,
 *     mark it with attribute "data-mx-md-display-inline"
 *
 *   - if a inline element beging used as block
 *     mark it with attribute "data-mx-md-display-block"
 */


// node types
const NODE_ELEMENT = 1, NODE_TEXT = 3;

// When belowing elements are used as children of <a>,
// the <a> element will be render somewhere else.
// such as as a wrapper of it's content or as a standalone empty link(not text).
//
// html, body, thead, tbody, tfoot, tr, th, td
//

// get from chatGPT...
const inlineElements = [
  'A',
  'ABBR',
  'ACRONYM',
  'B',
  'BDO',
  'BIG',
  'BR',
  'BUTTON',
  'CITE',
  'CODE',
  'DFN',
  'EM',
  'I',
  'IMG',
  'INPUT',
  'KBD',
  'LABEL',
  'MAP',
  'OBJECT',
  'OUTPUT',
  'Q',
  'SAMP',
  'SELECT',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'TEXTAREA',
  'TIME',
  'TT',
  'VAR'
].concat([
  // added by us
  'DEL',
  'INS',
  'PICTURE',
  'SVG',
  'MATHML',
]);


const meaningfulWhenBlankBlockElements = [
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD',
  'IFRAME', 'SCRIPT',
  'AUDIO', 'VIDEO',
  'PRE',
];

// If an anchor wrap these child, we remove this anchor wrapper.
const meaninglessBlockChilds = [
  "NOSCRIPT", "FRAMESET", "NOFRAMES", "FORM", "FIELDSET",
];

// We need to deeply analyze these elements
// so that when it's content is just one inlilne text,
// then there's not need to wrap it with two links.
const blockElementsThatNeedDeeplyAnalyze = [
  "DIV", "CENTER", "P", "FIGURE",
];

const voidElements = [
  'AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT',
  'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
];

const inlineTextWrappers = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];


function isInlineElement(node) {
  return node.nodeType == NODE_ELEMENT && inlineElements.indexOf(node.nodeName.toUpperCase()) > -1;
}

function needDeepAnalyze(node) {
  return node.nodeType == NODE_ELEMENT && blockElementsThatNeedDeeplyAnalyze.indexOf(node.nodeName.toUpperCase()) > -1
}


function isInlineTextWrapper(node) {
  return node.nodeType == NODE_ELEMENT && inlineTextWrappers.indexOf(node.nodeName.toUpperCase()) > -1
}


function handleAnchors(doc, elem) {
  iterateNodeList(elem.querySelectorAll('a'), (it) => {
    const result = analyzeChildNodes(it);
    // console.debug(result);

    if (result.blankBlockNodes && result.blankBlockNodes.length > 0) {
      ignoreNodes(result.blankBlockNodes);
    }

    switch(result.action) {
      case 'doNothing':
        break;
      case 'wrapAnchorContentWithLinks':
        wrapAnchorContentWithLinks(doc, it);
        break;
      case 'markAllWrappers':
        markAllWrappers(doc, it, result.wrappers);
        break;
      case 'moveAnchorToWrapContent':
        moveAnchorToWrapContent(doc, it, result.innermostWrapper);
        break;
      case 'appendAnchorToContent':
        appendAnchorToContent(doc, it, result.innermostWrapper);
        break;
      case 'removeAnchorAndItsContent':
        removeAnchorAndItsContent(it);
        break;
      case 'removeAnchorWrapperOnly':
        removeAnchorWrapperOnly(it);
        break;
      default: break;
    }
  });
}


function analyzeChildNodes(wrapper, ancestorWrappers = [], blankBlockNodes = []) {
  const countResult = countChildNodes(wrapper);
  // console.debug(countResult);

  const newBlankBlockNodes = [...blankBlockNodes];
  if (countResult.hasBlankBlockNode) {
    newBlankBlockNodes.push(...countResult.blankBlockNodes)
  }

  if (countResult.hasNonblankBlockNode) {
    return analyzeWrapperThatHasBlockChild(wrapper, {countResult, ancestorWrappers, blankBlockNodes: newBlankBlockNodes});
  } else {
    return analyzeWrapperThatHasNotBlockChild(wrapper, {countResult, ancestorWrappers, blankBlockNodes: newBlankBlockNodes});
  }
}


function analyzeWrapperThatHasNotBlockChild(wrapper, {countResult, ancestorWrappers, blankBlockNodes}) {
  if (isMultipleLines(wrapper)) {
    const action = 'wrapAnchorContentWithLinks';
    return {action};
  } else {
    // single line
    const wrappers = [...ancestorWrappers];
    if (wrapper.nodeName !== 'A') {
      wrappers.push(wrapper);
    }

    let action;
    if (wrappers.length == 0) {
      // wrapper is the anchor '<a>'
      action = 'doNothing';
    } else {
      action = 'markAllWrappers';
    }

    return {action, wrappers, blankBlockNodes};
  }
}


function analyzeWrapperThatHasBlockChild(wrapper, {countResult, ancestorWrappers, blankBlockNodes}) {
  // console.debug("nonblankblockNodeNum: ", countResult.nonblankBlockNodeNum);
  // console.debug("blankBlockNodeNum: ", countResult.blankBlockNodeNum);

  if (countResult.hasOnlyOneNonblankBlockNode) {
    // has only one nonblank block child node and this block child node has all content,
    // this child acts as a wrapper.
    const newAncestorWrappers = [...ancestorWrappers];
    if (wrapper.nodeName !== 'A') {
      newAncestorWrappers.push(wrapper);
    }
    const childWrapper = countResult.nonblankBlockNodes[0];
    return handleBlockWrapper(childWrapper, {countResult, ancestorWrappers: newAncestorWrappers, blankBlockNodes});
  } else {
    // has multiple block nodes
    // or has one block nodes and other inline nodes (text node, phrase node etc.)
    const action = 'wrapAnchorContentWithLinks';
    const wrappers = [...ancestorWrappers];
    return {action, wrappers}
  }
}


function handleBlockWrapper(wrapper, {countResult, ancestorWrappers, blankBlockNodes}) {
  if (isElementBlank(wrapper) && meaninglessWhenBlank(wrapper)) {
    const action = 'removeAnchorAndItsContent';
    return {action};
  }

  if (meaninglessBlockChilds.indexOf(wrapper.nodeName) > -1) {
    const action = 'removeAnchorWrapperOnly';
    return {action};
  }

  if (isInlineTextWrapper(wrapper)) {
    // generally these wrappers only contain single line text,
    // but it could be multiple lines of text or contains links
    // in rare cases.
    let action;
    if (isMultipleLines(wrapper) || containsLink(wrapper)) {
      action = 'appendAnchorToContent';
    } else {
      // single line
      action = 'moveAnchorToWrapContent';
    }
    return {action, innermostWrapper: wrapper};
  }

  if (!needDeepAnalyze(wrapper)) {
    const action = 'wrapAnchorContentWithLinks';
    return {action};
  }

  // we need deep analyze this wrapper
  return analyzeChildNodes(wrapper, ancestorWrappers, blankBlockNodes);
}


function removeAnchorAndItsContent(anchor) {
  anchor.parentNode.removeChild(anchor);
}

// from: <a><wrapper>...</wrapper></a>
//   to: <wrapper>...</wrapper>
function removeAnchorWrapperOnly(anchor) {
  const wrapper = anchor.children[0];
  anchor.parentNode.insertBefore(wrapper, anchor);
  anchor.parentNode.removeChild(anchor);
}


// from: <a><wrapper>...</wrapper></a>
//   to: <wrapper><a>...</a></wrapper>
function moveAnchorToWrapContent(doc, anchor, innermostWrapper) {
  if (anchor.hasAttribute('href')) {
    const newWrapper = doc.createElement(innermostWrapper.tagName);
    copyAttributes(newWrapper, innermostWrapper);

    const newAnchor = doc.createElement('a');
    copyAttributes(newAnchor, anchor);
    newWrapper.appendChild(newAnchor);

    anchor.parentNode.insertBefore(newWrapper, anchor);
    iterateNodeList(innermostWrapper.childNodes, (child) => newAnchor.appendChild(child));
  } else {
    anchor.parentNode.insertBefore(innermostWrapper, anchor);
  }
  anchor.parentNode.removeChild(anchor);
}


// from: <a><wrapper>...</wrapper></a>
//   to: <wrapper>...<a></a></wrapper>
function appendAnchorToContent(doc, anchor, innermostWrapper) {
  if (anchor.hasAttribute('href')) {
    const newWrapper = doc.createElement(innermostWrapper.tagName);
    copyAttributes(newWrapper, innermostWrapper);

    const newAnchor = doc.createElement('a');
    // https://www.compart.com/en/unicode/U+1F517
    // const chainChar = "🔗";
    const chainChar = "&#x1F517;";
    newAnchor.innerHTML = chainChar;
    copyAttributes(newAnchor, anchor);

    anchor.parentNode.insertBefore(newWrapper, anchor);
    iterateNodeList(innermostWrapper.childNodes, (child) => newWrapper.appendChild(child));
    newWrapper.appendChild(newAnchor);
  } else {
    anchor.parentNode.insertBefore(innermostWrapper, anchor);
  }
  anchor.parentNode.removeChild(anchor);
}



function wrapAnchorContentWithLinks(doc, anchor) {
  var wrapper = doc.createElement('div');
  anchor.parentNode.insertBefore(wrapper,  anchor);

  let firstNode, lastNode;
  if (anchor.hasAttribute('href')) {
    firstNode = doc.createElement('a');
    lastNode  = doc.createElement('a');
    copyAttributes(firstNode, anchor);
    copyAttributes(lastNode, anchor);
    firstNode.textContent = '↓↓↓';
    lastNode.textContent = '↑↑↑';
  }

  if (firstNode) {
    wrapper.appendChild(firstNode);
    wrapper.appendChild(doc.createElement('br'));
    wrapper.appendChild(doc.createElement('br'));
  }

  iterateNodeList(anchor.childNodes, (child) => wrapper.appendChild(child));
  if (lastNode) {
    wrapper.appendChild(doc.createElement('br'));
    wrapper.appendChild(doc.createElement('br'));
    wrapper.appendChild(lastNode)
  }

  anchor.parentNode.removeChild(anchor);
}



function markAllWrappers(doc, anchor, wrappers) {
  ignoreNodes(wrappers);
  var div = doc.createElement('div');
  anchor.parentNode.insertBefore(div, anchor);
  div.appendChild(anchor);
}


function ignoreNodes(nodes) {
  nodes.forEach((it) => it.setAttribute('data-mx-ignore-md', '1'));
}



function countChildNodes(node) {
  const childNum = node.childNodes.length;

  let inlineNodeNum = 0,
    blankBlockNodeNum = 0,
    nonblankBlockNodeNum = 0,
    textNodeNum  = 0,
    blankTextNodeNum = 0;

  const nonblankBlockNodes = [], blankBlockNodes = [];

  for (const childNode of node.childNodes) {
    switch(childNode.nodeType) {
      case NODE_TEXT: {
        textNodeNum++;
        if (isBlankTextNode(childNode)) {
          blankTextNodeNum++;
        }
        break;
      }
      case NODE_ELEMENT: {

        if (  childNode.hasAttribute('data-mx-md-display-inline')
          || !childNode.hasAttribute('data-mx-md-display-block') && isInlineElement(childNode)
        ) {
          inlineNodeNum++;
        } else {
          // block element
          if (isElementBlank(childNode) && meaninglessWhenBlank(childNode)) {
            blankBlockNodeNum++;
            blankBlockNodes.push(childNode);
          } else {
            nonblankBlockNodeNum++;
            nonblankBlockNodes.push(childNode);
          }
        }
        break;
      }
      default: break;
    }
  }

  return {
    childNum,
    blankBlockNodeNum,
    nonblankBlockNodeNum,
    blockNodeNum: blankBlockNodeNum + nonblankBlockNodeNum,
    textNodeNum,
    blankTextNodeNum,

    hasBlankBlockNode: blankBlockNodeNum > 0,
    hasNonblankBlockNode: nonblankBlockNodeNum > 0,
    hasMultipleNonblankBlockNode: nonblankBlockNodeNum > 1,
    hasOnlyOneNonblankBlockNode: nonblankBlockNodeNum == 1 && textNodeNum == blankTextNodeNum,

    blankBlockNodes,
    nonblankBlockNodes,
  };
}


function iterateNodeList(nodeList, callback) {
  const nodes = Array.from(nodeList);
  let currNode;
  while (currNode = nodes.shift()) {
    callback(currNode);
  }
}




function isElementBlank(node) {
  if (node.nodeType == NODE_ELEMENT) {
    return node.innerHTML.trim() === "";
  } else {
    throw new Error("Node should be an element")
  }
}


function meaninglessWhenBlank(node) {
  return meaningfulWhenBlankBlockElements.indexOf(node.nodeName) == -1;
}


function isBlankTextNode(node) {
  return node.nodeType == NODE_TEXT && isBlankStr(node.textContent);
}


function isMultipleLines(node) {
  return node.textContent.indexOf('\n') > -1 || node.querySelector('br') !== null;
}


function containsLink(node) {
  return node.querySelector('a') !== null;
}


function isBlankStr(str) {
  return str.match(/^\s*$/mg);
}


function copyAttributes(elem, fromElem) {
  [].forEach.call(fromElem.attributes, function (attr) {
    // ignore illegal attribute names
    try { elem.setAttribute(attr.name, attr.value) } catch (e) {}
  });
}


function handle(doc, elem) {
  handleAnchors(doc, elem);
  return elem;
}


export default {handle}
