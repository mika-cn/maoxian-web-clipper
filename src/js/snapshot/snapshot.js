
// EventTarget <-- Node <-- Element
//
// Node.nodeName is not always upper case, be careful (@see @MDN/en-US/docs/Web/API/Node/nodeName)
// Node.nodeType
// Node.hasChildNodes()
// Node.childNodes
//
// Element.hasAttributes()
// Element.attributes

// should capture shadowDom and iframe

import T                  from '../lib/tool.js';
import SortedArray        from '../lib/sorted-array.js';
import ExtMsg             from '../lib/ext-msg.js';
import {NODE_TYPE}        from '../lib/constants.js';
import MxAttribute        from './mx-attribute.js';
import StyleSheetSnapshot from './stylesheet.js';
import StyleScope         from './style-scope.js';
import CssTextParser      from './css-text-parser.js';
import CssBox             from './css-box.js';

const FRAME_URL = {
  BLANK  : 'about:blank',
  SRCDOC : 'about:srcdoc',
};

// @params - @see takeSnapshotOfCurrNode()
// @returns {Snapshot}
async function take(node, params) {
  const virtualSnapshot = {childNodes: []};
  const firstItem = {node, params, parentSnapshot: virtualSnapshot};
  const initValue = virtualSnapshot;

  const itemFn = async (currItem) => {
    const {node: currNode, params: currParams, parentSnapshot} = currItem;
    const {snapshot, children, childParams} = await takeSnapshotOfCurrNode(currNode, currParams);

    if (!parentSnapshot.hasOwnProperty('childNodes')) {
      parentSnapshot.childNodes = [];
    }
    parentSnapshot.childNodes.push(snapshot);

    const result = {};
    if (children) {
      const newItems = [];
      for (const child of children) {
        newItems.push({node: child, params: childParams, parentSnapshot: snapshot});
      }
      result.newItems = newItems;
    }
    return result;
  }

  const snapshot = await T.stackReduce(firstItem, itemFn, initValue);
  // snapshot is virtualSnapshot.
  return snapshot.childNodes[0];
}


/**
 * @param {Node} node
 * @param {Object} params
 * - {Window} win
 * - {Object} platform
 * - {RequestParams} requestParams
 * - {Object} frameInfo
 *   {String} extMsgType - the message type that send to nested iframes
 * - {Object} blacklist  - {upperCasedNodeName => isIgnore}
 *   {Object} shadowDom  - {blacklist: {upperCasedNodeName => isIgnore}}
 *   {Object} localFrame - {blacklist: {upperCasedNodeName => isIgnore}}
 * - {Function} ignoreFn - whether to ignore this element or not.
 * - {Boolean} ignoreHiddenElement (default: true)
 * - {CssBox} cssBox
 *
 * @returns {Object} it
 * - {Snapshot} snapshot
 * - {[Node]}   [children] - the child nodes of current node
 * - {Object}   [childParams] @see @param.params
 *
 */
async function takeSnapshotOfCurrNode(node, params) {
  const defaultAncestorInfo = {
    mathAncestor: false, svgAncestor: false,
    codeAncestor: false, preAncestor: false,
    detailsAncestor: false,
  };
  const {
    win, platform, frameInfo, requestParams, extMsgType, ancestorInfo = defaultAncestorInfo,
    blacklist = {}, ignoreFn, ignoreHiddenElement = true, cssBox,
  } = params;


  const snapshot = {name: node.nodeName, type: node.nodeType};

  switch(node.nodeType) {

    case NODE_TYPE.ELEMENT: {
      const upperCasedNodeName = node.nodeName.toUpperCase();

      if (blacklist[upperCasedNodeName]) {
        snapshot.ignore = true;
        snapshot.ignoreReason = 'onBlacklist';
        return {snapshot};
      }

      if (ignoreFn) {
        const {isIgnore, reason} = ignoreFn(node);
        if (isIgnore) {
          snapshot.ignore = true;
          snapshot.ignoreReason = reason;
          return {snapshot};
        }
      }

      if (ignoreHiddenElement) {
        let hidden;
        if ( ancestorInfo.detailsAncestor
          || ancestorInfo.mathAncestor
          || ancestorInfo.svgAncestor
        ) {
          // The current node is descendent of<details>, <math>, <svg>
          // Don't ignore it. (There might be side effects)
          hidden = false;
        } else {
          hidden = !isElemVisible(win, node, VISIBLE_WHITE_LIST);
        }
        if (hidden) {
          snapshot.ignore = true;
          snapshot.ignoreReason = 'isHidden';
          return {snapshot};
        }
      }


      const {attrObj, mxAttrObj} = handleAttrs(node);
      snapshot.attr = attrObj;
      if (mxAttrObj) { snapshot.mxAttr = mxAttrObj }

      // handle style attribute
      handleInlineStyle(node, {snapshot, cssBox});

      if (node.shadowRoot) {
        snapshot.isShadowHost = true;
        // If a shadowRoot contains <slot> nodes, the assigned nodes
        // will be exist in children of shadowRoot's host.
        // We ignore these nodes.
        return {
          snapshot: snapshot,
          children: [node.shadowRoot],
          childParams: Object.assign({}, params, (params.shadowDom || {})),
        }
      }

      switch(upperCasedNodeName) {
        case 'SLOT': {
          let children;
          // @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement
          if (node.assignedNodes().length > 0) {
            snapshot.assigned = true;
            children = node.assignedNodes();
          } else {
            snapshot.assigned = false;
            children = node.childNodes;
          }
          return {snapshot, children, childParams: params};
        }

        case 'LINK': {
          snapshot.childNodes = [];
          // Link types are case-insensitive.
          snapshot.relList = DOMTokenList2Array(node.relList, true);
          if (node.sheet) {
            const alternative = (snapshot.relList.indexOf('alternative') > -1);
            snapshot.sheet = await StyleSheetSnapshot.take(node.sheet, {
              requestParams, cssBox, win, platform, alternative});
          }
          return {snapshot};
        }

        case 'STYLE': {
          snapshot.childNodes = [];
          snapshot.sheet = await StyleSheetSnapshot.take(node.sheet, {
            requestParams, cssBox, win, platform});
          return {snapshot};
        }

        case 'IMG': {
          snapshot.childNodes = [];
          snapshot.currentSrc = node.currentSrc;
          return {snapshot};
        }

        case 'CANVAS': {
          try {
            snapshot.childNodes = [];
            snapshot.dataUrl = node.toDataURL();
          } catch(e) {
            // tained canvas etc.
          }
          return {snapshot};
        }

        case 'DETAILS':
        case 'CODE':
        case 'PRE':
        case 'MATH':
        case 'SVG': {
          const key = `${node.nodeName.toLowerCase()}Ancestor`;
          const newAncestorInfo = Object.assign({}, ancestorInfo, {[key]: true});
          return {
            snapshot: snapshot,
            children: node.childNodes,
            childParams: Object.assign({}, params, {ancestorInfo: newAncestorInfo}),
          };
        }

        case 'AUDIO':
        case 'VIDEO': {
          snapshot.currentSrc = node.currentSrc;
          return {
            snapshot: snapshot,
            children: node.childNodes,
            childParams: params,
          };
        }

        case 'TABLE': {
          snapshot.rowSize = node.rows.length;
          return {
            snapshot: snapshot,
            children: node.childNodes,
            childParams: params,
          };
        }


        case 'TEMPLATE': {
          return {
            snapshot: snapshot,
            children: [node.content],
            childParams: params,
          };
        }

        case 'IFRAME':
        case 'FRAME': {

          // All frame ids increase in document order (Same layer)
          // frame without src and srcdoc 's url is `about:blank`
          // frame with srcdoc 's url is `about:srcdoc
          // frame at the circular end 's url is `about:blank`

          let path;
          if (snapshot.attr.srcdoc) {
            path = FRAME_URL.SRCDOC;
          } else if (snapshot.attr.src) {
            path = snapshot.attr.src;
          } else {
            path = FRAME_URL.BLANK;
          }

          const {isValid, url, message} = completeUrl(path, win.document.baseURI);
          if (!isValid) {
            snapshot.childNodes = [];
            snapshot.errorMessage = message;
            snapshot.render = 'blank';
            return {snapshot};
          }

          if (isCircularFrame(frameInfo, url)) {
            snapshot.childNodes = [];
            snapshot.url = url;
            snapshot.errorMessage = 'Circular frame';
            snapshot.render = 'blank';
            return {snapshot};
          }

          const frame = findFrame(frameInfo, url);

          if (!frame) {
            console.info("Coundn't find frame use url: ", url);
            snapshot.childNodes = [];
            snapshot.url = url;
            snapshot.errorMessage = 'Frame not found';
            snapshot.render = 'blank';
            return {snapshot};
          }

          // This assignment is nasty. It changes the parameter (params)
          frame.used = true;

          snapshot.frame = {
            url: frame.url,
            frameId: frame.frameId,
            parentFrameId: frame.parentFrameId
          };

          if (frame.errorOccurred) {
            snapshot.childNodes = [];
            snapshot.errorMessage = 'Navigation interrupted';
            snapshot.render = 'blank';
            return {snapshot};
          }

          if (isBrowserExtensionUrl(url)) {
            snapshot.childNodes = [];
            snapshot.errorMessage = 'Is Browser extension iframe';
            snapshot.render = 'ignore';
            return {snapshot};
          }

          const newFrameInfo = {
            allFrames: [...frameInfo.allFrames],
            ancestors: [frame, ...frameInfo.ancestors],
          }

          if (url == FRAME_URL.SRCDOC || url == FRAME_URL.BLANK) {
            // local frames can directly access `node.contentDocument`.
            //
            // Although some frames' url is "about:blank",
            // There still has a posibility that it's content
            // was generated by JS rather than just blank.

            const children = [node.contentDocument];
            const childParams = Object.assign(
              {}, params,
              (params.localFrame || {}),
              {frameInfo: newFrameInfo}
            );
            return {snapshot, children, childParams};
          }


          try {
            // remote frames (included through a URL)
            // take snapshot through extension message

            snapshot.childNodes = [];
            const extMsg = {
              platform: platform,
              frameId: frame.frameId,
              frameInfo: newFrameInfo,
              requestParams: requestParams.toObject(),
            }
            if (cssBox) {
              extMsg.cssBoxParams = cssBox.toParams();
            }
            const frameSnapshot = await ExtMsg.sendToBackend('clipping', {
              type: extMsgType,
              body: extMsg,
            })

            if (frameSnapshot) {
              snapshot.childNodes.push(frameSnapshot);
            } else {
              // The address wasn’t understood by Firefox
              // unknow protocol
            }

            return {snapshot};

          } catch(e) {

            snapshot.childNodes = [];
            snapshot.errorMessage = e.message;
            snapshot.render = 'blank';
            return {snapshot}
          }
        }

        default: {
          const children = sortChildren(node.childNodes, mxAttrObj);
          return {snapshot, children, childParams: params};
        }
      }

      break;
    }

    case NODE_TYPE.TEXT: {
      snapshot.text = node.data;
      if (ancestorInfo.codeAncestor) { snapshot.codeAncestor = true }
      if (ancestorInfo.preAncestor) { snapshot.preAncestor = true }
      const {blank, needEscape} = parseText(node.data);
      if (blank) { snapshot.blank = true }
      if (needEscape) { snapshot.needEscape = true }
      break;
    }

    case NODE_TYPE.COMMENT: {
      snapshot.text = node.data;
      break;
    }

    case NODE_TYPE.DOCUMENT: {
      snapshot.docUrl = node.location.href;
      snapshot.baseUrl = node.baseURI;
      let childParams = params;
      if (cssBox) {
        const childCssBox = cssBox.createChildBox({node});
        childCssBox.setSnapshot(snapshot);
        childParams = Object.assign({}, params, {cssBox: childCssBox});
      }

      return { snapshot, childParams, children: node.childNodes };
    }

    case NODE_TYPE.DOCUMENT_TYPE: {
      // nodeName is xxx in <!DOCTYPE xxx>
      break;
    }

    case NODE_TYPE.DOCUMENT_FRAGMENT: {
      let childParams = params;
      let childCssBox;

      if (node.host) {
        snapshot.isShadowRoot = true;
        snapshot.mode = node.mode;
        snapshot.docUrl = node.host.ownerDocument.location.href;
        snapshot.baseUrl = node.host.baseURI;
        if (cssBox) {
          childCssBox = cssBox.createChildBox({node});
          childCssBox.setSnapshot(snapshot);
          childParams = Object.assign({}, params, {cssBox: childCssBox});
        }
      }
      return {snapshot, childParams, children: node.childNodes};
    }

    case NODE_TYPE.PROCESSING_INSTRUCTION:
      break;
    case NODE_TYPE.CDATA_SECTION:
      break;
    case NODE_TYPE.ATTRIBUTE:
    case NODE_TYPE.ENTITY_REFERENCE:
    case NODE_TYPE.ENTITY:
    case NODE_TYPE.NOTATION:
      // deprecated and should not be used anymore.
      break;
    default: break;
  }

  return {snapshot};
}


/**
 * take snapshot toward ancestor nodes.
 *
 * @param {Node} node start from this element
 * @param {Array(Snapshot)} snapshots (current layer snapshots)
 * @param {CssBox} cssBox
 * @param {Function} modifier
 *
 * @return {Object} {snapshot, cssBox}
 */
function takeAncestorsSnapshot(lastNode, snapshots, cssBox, modifier) {
  let node, createParentCssBox = false;

  if (lastNode.nodeType == NODE_TYPE.DOCUMENT_FRAGMENT && lastNode.host) {
    // lastNode is shadowRoot
    node = lastNode.host;
    createParentCssBox = true;
  } else {
    node = (lastNode.assignedSlot || lastNode.parentNode);
    if (node && lastNode.nodeType == NODE_TYPE.DOCUMENT) {
      // node is a frame
      createParentCssBox = true;
    }
  }

  if (node) {
    const currCssBox = createParentCssBox ? cssBox.createParentBox({node}) : cssBox;
    const snapshot = {name: node.nodeName, type: node.nodeType};
    switch(node.nodeType) {
      case NODE_TYPE.ELEMENT:

        const {attrObj, mxAttrObj} = handleAttrs(node);
        snapshot.attr = attrObj;
        if (mxAttrObj) { snapshot.mxAttr = mxAttrObj }

        // handle style attribute
        handleInlineStyle(node, {snapshot, cssBox: currCssBox});

        snapshot.childNodes = snapshots;
        if (node.shadowRoot) {
          snapshot.isShadowHost = true;
          break;
        }

        if (node.nodeName.toUpperCase() == 'SLOT') {
          snapshot.assigned = node.assignedNodes().length > 0;
          break;
        }

        break;

      case NODE_TYPE.DOCUMENT:
        snapshot.childNodes = snapshots;
        snapshot.docUrl = node.location.href;
        snapshot.baseUrl = node.baseURI;
        if (currCssBox) { currCssBox.setSnapshot(snapshot) }
        break;

      case NODE_TYPE.DOCUMENT_FRAGMENT:
        if (node.host) {
          snapshot.isShadowRoot = true;
          snapshot.mode = node.mode;
          snapshot.docUrl = node.host.ownerDocument.location.href;
          snapshot.baseUrl = node.host.baseURI;
          if (currCssBox) { currCssBox.setSnapshot(snapshot) }
        }
        snapshot.childNodes = snapshots;
        break;
    }

    const newSnapshots = modifier(node, snapshot);
    return takeAncestorsSnapshot(node, newSnapshots, currCssBox, modifier);
  } else {
    // reach the outmost node: Document.
    return {snapshot: snapshots[0], cssBox: cssBox};
  }
}



function handleAttrs(elem) {
  const attrObj = {};
  const mxAttr = new MxAttribute();

  Array.prototype.forEach.call(elem.attributes, (attr) => {
    if (MxAttribute.is(attr)) {
      mxAttr.add(attr);
    } else {
      attrObj[attr.name] = attr.value;
    }
  });

  const result = {attrObj};
  if (mxAttr.exist) {
    result.mxAttrObj = mxAttr.toObject();
  }

  return result;
}




/**
 * Warning:
 *   This function will modify snapshot and cssBox
 */
function handleInlineStyle(node, {snapshot, cssBox}) {

  let styleObj;
  if (node.style && node.style.length > 0) {
    styleObj = CssTextParser.parse(node.style.cssText);
    if (cssBox && cssBox.removeUnusedRules) {
      cssBox.scope.recordReferences(node.style);
    }
  }

  const {lockedStyle} = (snapshot.mxAttr || {})
  if (lockedStyle) {
    styleObj = Object.assign((styleObj || {}), lockedStyle);
  }

  if (styleObj) { snapshot.styleObj = styleObj }
}


function sortChildren(nodes, mxAttrObj = {}) {
  const {orderByIndex = false} = mxAttrObj;

  if (orderByIndex) {
    const r = [];
    const elemIndexes = [];
    const tmpArr = new SortedArray();

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.nodeType == NODE_TYPE.ELEMENT) {
        elemIndexes.push(i);
        const index = node.getAttribute('data-mx-index');
        tmpArr.push(node, index);
        r.push(null);
      } else {
        r.push(node);
      }
    }

    for (const node of tmpArr) {
      const idx = elemIndexes.shift();
      r[idx] = snapshot;
    }

    return r;
  } else {
    return nodes;
  }
}


// ===================================


function DOMTokenList2Array(list, caseInsensitive = false) {
  const r = [];
  for (const v of list.values()) {
    if (caseInsensitive) {
      r.push(v.toLowerCase());
    } else {
      r.push(v);
    }
  }
  return r;
}


function findFrame(frameInfo, url) {
  if (frameInfo.ancestors.length == 0) {
    throw new Error("findFrame: Invalid frameInfo, ancestors should not be empty");
  } else {
    const parentFrame = frameInfo.ancestors[0];
    return frameInfo.allFrames.find((it) => {
      return it.url == url && it.parentFrameId == parentFrame.frameId && !it.used;
    });
  }
}


function isCircularFrame(frameInfo, url) {
  switch(url) {
    case FRAME_URL.BLANK:
    case FRAME_URL.SRCDOC:
      return false;
    default:
      return frameInfo.ancestors.findIndex((it) => it.url === url) > -1;
  }
}


function completeUrl(path, baseUrl) {
  try {
    const url = (new URL(path, baseUrl)).href;
    return {isValid: true, url: url};
  } catch(e) {
    return {isValid: false, message: e.message};
  }
}


function isBrowserExtensionUrl(url) {
  if(url.indexOf('://') > -1) {
    const protocol = url.split('://')[0];
    return !!protocol.match(/-extension$/);
  } else {
    return false
  }
}


const VISIBLE_WHITE_LIST = [
  'HEAD', 'META', 'TITLE',
  'LINK', 'STYLE', 'INPUT',
  'MAP', 'AREA',
];


function isElemVisible(win, elem, whiteList = []) {
  if(whiteList.length > 0
    && whiteList.indexOf(elem.tagName.toUpperCase()) > -1
  ) {
    return true
  }

  const style = win.getComputedStyle(elem);
  if(style.display === 'none') {
    return false;
  }

  if(style.visibility === 'hidden'){
    return false
  }

  return true
}

// ===================================

// This function is not used.
function each(node, fn, ancestors = [], ancestorDocs = []) {
  const iterateChildren = fn(node, ancestors, ancestorDocs);
  if (iterateChildren && node.childNodes && node.childNodes.length > 0) {
    const newAncestors = [node, ...ancestors];
    let newAncestorDocs = ancestorDocs;
    if (node.type == NODE_TYPE.DOCUMENT) {
      newAncestorDocs = [node, ...ancestorDocs];
    }
    node.childNodes.forEach((it) => {
      if (!it) { console.log(node); }
      each(it, fn, newAncestors, newAncestorDocs);
    });
  }
}




/**
 * @params @see applyFnToElem()
 */
async function eachElement(node, fn, ancestorParams = {}) {
  const {ancestors = [], ancestorDocs = [], ancestorRoots = []} = ancestorParams;
  const firstItem = {node, ancestorParams: {ancestors, ancestorDocs, ancestorRoots}};
  const itemFn = async (currItem) => {
    const {node, ancestorParams: currAncestorParams} = currItem;
    const {children, ancestorParams} = await applyFnToElem(node, fn, currAncestorParams);

    const result = {};
    if (children.length > 0) {
      const newItems = [];
      for (const child of children) {
        newItems.push({node: child, ancestorParams});
      }
      result.newItems = newItems;
    }
    return result;
  }
  await T.stackReduce(firstItem, itemFn);
}


/**
 * @param {Snapshot} node
 * @param {Function} fn - element handler (return true if iterateChildren)
 * @param {Object}   ancestorParams
 * @param {[Snapshot]} ancestorParams.ancestors
 * @param {[Snapshot]} ancestorParams.ancestorDocs - Document nodes.
 * @param {[Snapshot]} ancestorParams.ancestorRoots - Document or ShadowRoot nodes
 *
 * @returns {Object} it {:children, :ancestorParams}
 */
async function applyFnToElem(node, fn, ancestorParams) {

  const {ancestors = [], ancestorDocs = [], ancestorRoots = []} = ancestorParams;

  switch(node.type) {

    case NODE_TYPE.ELEMENT: {
      if (node.ignore) { break }

      const iterateChildren = await fn(node, ancestors, ancestorDocs, ancestorRoots);
      if (iterateChildren && node.childNodes && node.childNodes.length > 0) {
        const newAncestors = [node, ...ancestors];
        return {
          children: node.childNodes,
          ancestorParams: Object.assign({}, ancestorParams, {ancestors: newAncestors}),
        };
      }
      break;
    }

    case NODE_TYPE.DOCUMENT: {
      if (node.childNodes) {
        const newAncestors = [node, ...ancestors];
        const newAncestorDocs = [node, ...ancestorDocs];
        const newAncestorRoots = [node, ...ancestorRoots];
        return {
          children: node.childNodes,
          ancestorParams: {
            ancestors: newAncestors,
            ancestorDocs: newAncestorDocs,
            ancestorRoots: newAncestorRoots,
          }
        };
      }
      break;
    }

    case NODE_TYPE.DOCUMENT_FRAGMENT: {
      if (node.childNodes) {
        const newAncestors = [node, ...ancestors];
        const newAncestorRoots = [...ancestorRoots];
        // is shadowRoot?
        if (node.host) { newAncestorRoots.unshift(node) }

        return {
          children: node.childNodes,
          ancestorParams: {
            ancestors: newAncestors,
            ancestorDocs: ancestorDocs,
            ancestorRoots: newAncestorRoots,
          }
        };
      }

      break;
    }

  }

  return {children: []};
}


// ============================================


class SnapshotAccessor {
  constructor(snapshot) {
    this.node = snapshot;
    this._change = snapshot.change;
    this.defineGetter([
      'name',
      'type',
      'ignore',
      'ignoreReason',
      'isShadowHost',
      'isShadowRoot',
      'render',
      'errorMessage',
      'needEscape',
      'text',
      'html',
    ]);
  }

  set change(v) {
    this._change = v;
  }

  get tagName() {
    return this.name.toLowerCase();
  }

  get childNodes() {
    return this.node.childNodes || [];
  }

  getAttrHTML() {
    const deletedAttr = ((this._change || {}).deletedAttr || {});
    const attrObj = Object.assign( {},
      (this.node.attr || {}),
      ((this._change || {}).attr || {})
    );
    let attrHTML = '';
    for (let name in attrObj) {
      if (!deletedAttr[name]) {
        if (attrObj[name]) {
          attrHTML += ` ${name}="${T.escapeHtmlAttr(attrObj[name])}"`;
        } else {
          attrHTML += ` ${name}`;
        }
      }
    }
    return attrHTML;
  }

  defineGetter(props) {
    for (const prop of props) {
      this.__defineGetter__(prop, () => {
        return (this._change || {})[prop] || this.node[prop];
      });
    }
  }

}


// ============================================
// serialization
// ============================================

async function toHTML(snapshot, subHtmlHandler, params = {}) {
  const SNAPSHOT = 1, STR = 2, FUNCTION = 3;
  const firstItem = {type: SNAPSHOT, snapshot, params};
  const initValue = {htmlStack: [], currHTML: ""};

  const itemFn = async (currItem, value) => {

    if (currItem.type == SNAPSHOT) {
      const {snapshot, params} = currItem;
      const result = await snapshotToHTML(snapshot, subHtmlHandler, params);

      const [first, second] = T.toArray(result);
      const {html, startTag, endTag, children, childParams, fn, fnParams} = first;

      if (html) {
        value.currHTML += html;
        return {newValue: value};
      }

      if (startTag) {
        value.currHTML += startTag
      }

      const newItems = [];

      const handleChildren = function({children, childParams}) {
        if (children && children.length > 0) {
          for (const child of children) {
            newItems.push({type: SNAPSHOT, snapshot: child, params: childParams});
          }
        }
      }
      handleChildren(first);


      if (endTag) {
        newItems.push({type: STR, str: endTag});
      }

      if (fn) {
        value.htmlStack.push(value.currHTML);
        newItems.push({type: FUNCTION, fn, fnParams})
        value.currHTML = "";
      }

      // currently the second can only contains children.
      if (second) { handleChildren(second) }

      return {newItems, newValue: value};
    }

    if (currItem.type == STR) {
      value.currHTML += currItem.str;
      return {newValue: value};
    }

    if (currItem.type == FUNCTION) {
      const {fn, fnParams} = currItem;
      const subHtml = value.currHTML;
      const html = await fn(Object.assign({subHtml}, fnParams));
      value.currHTML = value.htmlStack.pop() + html;
      return {newValue: value};
    }
  }

  const result = await T.stackReduce(firstItem, itemFn, initValue);
  return result.currHTML;
}




// @see: @mdn/en-US/docs/Glossary/Empty_element
const EMPTY_ELEMENT = {
  AREA   : true,
  BASE   : true,
  BR     : true,
  COL    : true,
  EMBED  : true,
  HR     : true,
  IMG    : true,
  INPUT  : true,
  KEYGEN : true,
  LINK   : true,
  META   : true,
  PARAM  : true,
  SOURCE : true,
  TRACK  : true,
  WBR    : true,
}

/**
 * @param {Snapshot} snapshot
 * @param {Function} subHtmlHandler({});
 * @param {Object} params
 *   - {array} ancestorDocs
 *   - {String} shadowDomRenderMethod ("DeclarativeShadowDom" or "Tree")
 *
 * @returns {Object|[Object,Object]} it - may be Array if snapshot is shadow root.
 * - {String}     [html] - the snapshot can render to html directly
 * - {String}     [startTag] - HTML start tag
 * - {[Snapshot]} [children] - the snapshot's childNodes.
 * - {Object}     [childParams] - @see @param.params
 * - {String}     [endTag] - HTML end tag
 * - {Function}   [fn] - the snapshot can only be rendered by this function
 * - {Object}     [fnParams] - params of fn
 */
async function snapshotToHTML(snapshot, subHtmlHandler, params = {}) {
  const {ancestorDocs = [], shadowDomRenderMethod = 'DeclarativeShadowDom'} = params;
  const it = new SnapshotAccessor(snapshot);

  switch(it.type) {
    case NODE_TYPE.ELEMENT:
      if (it.ignore) { return {html: ''}}
      const isEmptyElement = EMPTY_ELEMENT[it.name];

      if (isEmptyElement) {
        // empty element only needs start tag.
        return {startTag: getStartTag(it)};

      } else {

        switch(it.name) {
          case 'FRAME':
          case 'IFRAME': {
            if (snapshot.render == 'ignore') { return {html: ''}}

            const fnParams = {snapshot, ancestorDocs};
            let children = [];
            if (snapshot.errorMessage) {
              fnParams.subHtml = ''
            } else {
              children = snapshot.childNodes;
            }
            const fn = async function(params) {
              const {snapshot, subHtml, ancestorDocs} = params;
              const change = await subHtmlHandler(params);
              if (change.type || change.name) {
                // is a new snapshot (html string node)
                snapshot.change = change;
                return (new SnapshotAccessor(snapshot)).html;
              } else {
                if (change.ignore) {
                  return '';
                } else {
                  it.change = change;
                  return getStartTag(it) + getEndTag(it);
                }
              }
            }
            return {fn, fnParams, children, childParams: params};
          }

          case 'SLOT': {

            const result = {startTag: getStartTag(it), endTag: getEndTag(it)};
            let children = [];
            if (shadowDomRenderMethod == 'DeclarativeShadowDom') {
              if (snapshot.assigned) {
                // ChildNodes have handled in shadowRoot
              } else {
                children = it.childNodes;
              }
            } else {
              // Tree
              children = it.childNodes;
            }
            result.children = children;
            result.childParams = params;
            return result;
          }

          default:
            return {
              startTag: getStartTag(it),
              endTag: getEndTag(it),
              children: it.childNodes,
              childParams: params,
            }
        }
      }

    case NODE_TYPE.TEXT:
      return {html: it.needEscape && escapeText(it.text) || it.text};

    case NODE_TYPE.PROCESSING_INSTRUCTION:
      break;

    case NODE_TYPE.COMMENT:
      return {html: it.text.length > 0 ? `<!-- ${it.text} -->` : ""};

    case NODE_TYPE.DOCUMENT: {
      const newAncestorDocs = [snapshot, ...ancestorDocs];
      return {
        children: it.childNodes,
        childParams: {ancestorDocs: newAncestorDocs, shadowDomRenderMethod},
      };
    }

    case NODE_TYPE.DOCUMENT_TYPE:
      return {html: `<!DOCTYPE ${it.name || 'html'}>\n`}

    case NODE_TYPE.DOCUMENT_FRAGMENT:
      {
        if (snapshot.isShadowRoot) {
          if (shadowDomRenderMethod == 'DeclarativeShadowDom') {
            // handle shadowDOM
            const first = {children: it.childNodes, childParams: params};
            first.fnParams = {snapshot};
            first.fn = function({snapshot, subHtml}) {
              // subHtml is shadowDOM html
              return `<template shadowroot="${snapshot.mode}">${subHtml}</template>`;
            }

            // handle lightDOM
            const second = {children: getAssignedNodes(snapshot), childParams: params};
            return [first, second];
          } else {
            return {children: it.childNodes, childParams: params};
          }
        } else {
          return {children: it.childNodes, childParams: params};
        }
      }

    case NODE_TYPE.ATTRIBUTE:
    case NODE_TYPE.CDATA_SECTION:
    case NODE_TYPE.ENTITY_REFERENCE:
    case NODE_TYPE.ENTITY:
    case NODE_TYPE.NOTATION:
      // deprecated and should not be used anymore.
      break;

    case NODE_TYPE.HTML_STR:
      return {html: it.html};
    default: break;
  }
  return {html: ''};
}

// @param {SnapshotAccessor} it
function getStartTag(it) {
  return '<' + it.tagName + it.getAttrHTML() + '>';
}

// @param {SnapshotAccessor} it
function getEndTag(it) {
  return '</' + it.tagName + '>';
}


function getAssignedNodes(shadowRootSnapshot) {
  const assignedNodes = [];
  const queue = [];

  function pushNodesToQueue(nodes, depth) {
    nodes.forEach((node) => queue.push([depth, node]));
  }

  pushNodesToQueue(shadowRootSnapshot.childNodes, 1);

  let currItem;
  while(currItem = queue.shift()) {
    const [depth, node] = currItem;
    if (node.name === 'SLOT') {
      if (depth == 0) {
        throw new Error("Depth should not be zero");
      }
      if (depth == 1) {
        if (node.assigned) {
          assignedNodes.push(...node.childNodes);
        } else {
          // Do nothing
        }
      } else {
        // console.log("Depth: ", depth);
        pushNodesToQueue(node.childNodes, depth - 1);
      }
    } else {
      if (node.childNodes) {
        node.childNodes.forEach((childNode) => {
          if (childNode.isShadowRoot) {
            queue.push([depth + 1, childNode]);
          } else {
            queue.push([depth, childNode]);
          }
        });
      }
    }
  }
  // console.log("~>", assignedNodes);
  return assignedNodes;
}


function escapeText(text) {
  return (text || "").replace(/[&<>]/g, function (s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
    })[s];
  });
}


// [ \f\n\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]
const CODE_SPACE   = 0x0020;
const CODE_SPACE_F = 0x000C; // \f form feed
const CODE_SPACE_T = 0x0009; // \t
const CODE_SPACE_V = 0x000B; // \v
const CODE_SPACE_N = 0x000A; // \n
const CODE_SPACE_R = 0x000D; // \r
const CODE_SPACE_U00A0 = 0x00A0; // unicode space
const CODE_SPACE_U1680 = 0x1680;
const CODE_SPACE_U2000 = 0x2000;
const CODE_SPACE_U200A = 0x200A;
const CODE_SPACE_U2028 = 0x2028;
const CODE_SPACE_U2029 = 0x2029;
const CODE_SPACE_U202F = 0x202F;
const CODE_SPACE_U205F = 0x205F;
const CODE_SPACE_U3000 = 0x3000;
const CODE_SPACE_UFEFF = 0xFEFF;

const CODE_AMPERSAND = 0x0026; // &
const CODE_L_ANGLE_BRACKET = 0x003C; // <
const CODE_R_ANGLE_BRACKET = 0x003E; // >

function parseText(text) {
  let blank = true;
  let needEscape = false;
  let code;
  for (let i = 0; i < text.length; i++) {
    code = text.charCodeAt(i);
    if (blank && (
         code == CODE_SPACE
      || code == CODE_SPACE_N
      || code == CODE_SPACE_T
      || code == CODE_SPACE_R
      || code == CODE_SPACE_V
      || code == CODE_SPACE_F
      || code == CODE_SPACE_U00A0
      || code == CODE_SPACE_U1680
      || code >= CODE_SPACE_U2000 && code <= CODE_SPACE_U200A
      || code == CODE_SPACE_U2028
      || code == CODE_SPACE_U2029
      || code == CODE_SPACE_U202F
      || code == CODE_SPACE_U205F
      || code == CODE_SPACE_U3000
      || code == CODE_SPACE_UFEFF
    )) {
      // the "blank" is true and current character is white space.
      // do nothing
    } else {
      if (blank) { blank = false }
      if ( code == CODE_L_ANGLE_BRACKET
        || code == CODE_R_ANGLE_BRACKET
        || code == CODE_AMPERSAND
      ) {
        needEscape = true;
        break;
      }
    }
  }
  return {blank, needEscape};
}

// ================================================

function accessNode(snapshot, namePath, fn) {
  let currNode = snapshot;
  for(const name of namePath) {
    const child = currNode.childNodes.find((it) => it.name == name);
    if (child) {
      currNode = child;
    } else {
      throw new Error(`Cound not find node according to namePath: ${namePath}`);
    }
  }
  fn(currNode);
}


// WARNING: this function will modify the snapshot.
function appendClassName(snapshot, name) {
  if (!snapshot.attr) {snapshot.attr = {}}
  const names = (snapshot.attr.class || '').split(/\s+/)
  names.push(name);
  snapshot.attr.class = names.filter((it) => it !== '').join(' ');
}

// WARNING: this function will modify the snapshot.
function appendStyleObj(snapshot, styleObj) {
  snapshot.styleObj = Object.assign(snapshot.styleObj || {}, styleObj);
}

function createCssBox({node, removeUnusedRules}) {
  return new CssBox({node, removeUnusedRules});
}

export default Object.assign({
  take,
  takeAncestorsSnapshot,
  accessNode,
  appendClassName,
  appendStyleObj,
  createCssBox,
}, {
  each,
  eachElement,
  toHTML
});

