"use strict";

import T from './tool.js';

/*
 * wrap the html inside a div if it's a <body>, <html> tag.
 */
function parseHTML(win, html) {
  const parser = new win.DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rootNode = doc.body.children[0];
  return {doc: doc, node: rootNode};
}

function markHiddenNode(win, node) {
  // some awesome website use hidden input to avoid js, We keep them.
  const whiteList = ['LINK', 'STYLE', 'INPUT'];
  const nodeIterator = win.document.createNodeIterator(
    node, win.NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (it) => {
        if (T.isElemVisible(win, it, whiteList)) {
          return win.NodeFilter.FILTER_REJECT;
        } else {
          return win.NodeFilter.FILTER_ACCEPT;
        }
      }
    }
  );
  let curr;
  while(curr = nodeIterator.nextNode()) {
    curr.setAttribute('data-mx-hidden-node', '1');
  }
}

function removeMxMarker(contextNode) {
  const selector = '[data-mx-marker]';
  const nodes = contextNode.querySelectorAll(selector);
  [].forEach.call(nodes, (it) => {
    it.removeAttribute('data-mx-marker');
    it.removeAttribute('data-mx-id');
  })
}

function clearHiddenMark(contextNode) {
  const selector = '[data-mx-hidden-node="1"]';
  const nodes = contextNode.querySelectorAll(selector);
  [].forEach.call(nodes, (it) => {
    it.removeAttribute('data-mx-hidden-node');
  })
}

function removeNodeByHiddenMark(contextNode) {
  const selector = '[data-mx-hidden-node="1"]';
  const nodes = contextNode.querySelectorAll(selector);
  [].forEach.call(nodes, (it) => {
    it.parentNode.removeChild(it);
  })
  return contextNode;
}

function removeNodeByXpaths(doc, contextNode, xpaths) {
  const childToRemove = [];
  xpaths.forEach((xpath) => {
    const child = findNodeByXpath(doc, contextNode, xpath);
    if(child){
      childToRemove.push(child);
    } else {
      console.error("Xpath node not found", xpath);
    }
  });

  childToRemove.forEach((child) => {
    const pNode = child.parentElement;
    pNode.removeChild(child);
  })
  return contextNode;
}

function removeNodeBySelectors(contextNode, selectors) {
  selectors.forEach((it) => {
    const nodes = contextNode.querySelectorAll(it);
    [].forEach.call(nodes, (node) => {
      node.parentNode.removeChild(node);
    });
  })
  return contextNode;
}

function findNodeByXpath(doc, contextNode, xpath) {
  const XPathResult_FIRST_ORDERED_NODE_TYPE = 9
  return doc.evaluate(
    xpath,
    contextNode,
    null,
    XPathResult_FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

// Do not pass selector that you cann't control
function querySelectorIncludeSelf(contextNode, selector) {
  // ShadowRoot doen't have `matches()`;
  if (contextNode.matches && contextNode.matches(selector)) {
    return [contextNode];
  } else {
    return contextNode.querySelectorAll(selector);
  }
}

function calcXpath(contextNode, targetNode) {
  let currNode = targetNode;
  let pNode = targetNode.parentNode;
  let xpath = '';
  while (currNode != contextNode) {
    if (!pNode) { return '' }
    const idx = [].indexOf.call(pNode.children, currNode) + 1;
    const part = `*[${idx}]`;
    xpath = (xpath !== '' ? [part, xpath].join('/') : part);
    currNode = pNode;
    pNode = pNode.parentNode;
  }
  return xpath;
}


function getWebPageTitle(win, contextElem) {
  if (contextElem) {
    let currElem = contextElem;
    while (currElem && currElem.tagName.toUpperCase() != 'HTML') {
      const header = getElemTitle(win, currElem);
      if (header) { return header }
      if (currElem.parentElement) {
        currElem = currElem.parentElement;
      } else {
        // If the contextElem is inside some tree scope like shadowDOM
        // We are not handling these cases yet
        break;
      }
    }
    return win.document.title;
  } else {
    return getElemTitle(win, win.document.body) || win.document.title;
  }
}


function getElemTitle(win, contextElem) {
  const elems = querySelectorIncludeSelf(contextElem, 'h1');
  const header = (elems.length > 0 ? elems[0].textContent.trim() : '');
  if (header && win.document.title.startsWith(header)) {
    return header;
  } else {
    return '';
  }
}

const DOMTool = {
  parseHTML,
  markHiddenNode,
  removeNodeByHiddenMark,
  clearHiddenMark,
  removeMxMarker,

  removeNodeByXpaths,
  removeNodeBySelectors,
  calcXpath,
  findNodeByXpath,
  querySelectorIncludeSelf,

  getWebPageTitle,
  getElemTitle,
}

export default DOMTool;

