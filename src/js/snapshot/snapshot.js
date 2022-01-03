
// EventTarget <-- Node <-- Element
//
// Node.nodeName
// Node.nodeType
// Node.hasChildNodes()
// Node.childNodes
//
// Element.hasAttributes()
// Element.attributes

// should capture shadowDom and iframe

import T                  from '../lib/tool.js';
import ExtMsg             from '../lib/ext-msg.js';
import {NODE_TYPE}        from '../lib/constants.js';
import StyleSheetSnapshot from './stylesheet.js';
import StyleScope         from './style-scope.js';
import CssTextParser      from './css-text-parser.js';
import CssBox             from './css-box.js';

const FRAME_URL = {
  BLANK  : 'about:blank',
  SRCDOC : 'about:srcdoc',
};


/**
 * @param {Object} params
 * - {Window} win
 * - {Object} platform
 * - {RequestParams} requestParams
 * - {Object} frameInfo
 *   {String} extMsgType - the message type that send to nested iframes
 * - {Object} blacklist  - {nodeName => isIgnore}
 *   {Object} shadowDom  - {blacklist: {nodeName => isIgnore}}
 *   {Object} srcdocFrame - {blacklist: {nodeName => isIgnore}}
 * - {Function} ignoreFn - whether to ignore this element or not.
 * - {Boolean} ignoreHiddenElement (default: true)
 * - {CssBox} cssBox
 *
 * @return {Snapshot|undefined} node
 */
async function takeSnapshot(node, params) {

  const defaultAncestorInfo = {codeAncestor: false, preAncestor: false};
  const {
    win, platform, frameInfo, requestParams, extMsgType, ancestorInfo = defaultAncestorInfo,
    blacklist = {}, ignoreFn, ignoreHiddenElement = true, cssBox,
  } = params;

  const snapshot = {name: node.nodeName, type: node.nodeType};

  switch(node.nodeType) {

    case NODE_TYPE.ELEMENT: {

      if (blacklist[snapshot.name]) {
        snapshot.ignore = true;
        snapshot.ignoreReason = 'onBlacklist';
        return snapshot;
      }

      if (ignoreFn) {
        const {isIgnore, reason} = ignoreFn(node);
        if (isIgnore) {
          snapshot.ignore = true;
          snapshot.ignoreReason = reason;
          return snapshot;
        }
      }

      if (ignoreHiddenElement && !isElemVisible(win, node, VISIBLE_WHITE_LIST)) {
        snapshot.ignore = true;
        snapshot.ignoreReason = 'isHidden';
        return snapshot;
      }


      snapshot.attr = handleAttrs(node);

      if (node.shadowRoot) {
        snapshot.isShadowHost = true;
        // If a shadowRoot contains <slot> nodes, the assigned nodes
        // will be exist in children of shadowRoot's host.
        // We ignore these nodes.
        const newParams = Object.assign({}, params, (params.shadowDom || {}));
        snapshot.childNodes = [await takeSnapshot(node.shadowRoot, newParams)];
        break;
      }

      switch(node.nodeName) {
        case 'SLOT': {
          // @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement
          if (node.assignedNodes().length > 0) {
            snapshot.assigned = true;
            snapshot.childNodes = await handleNodes(node.assignedNodes(), params);
          } else {
            snapshot.assigned = false;
            snapshot.childNodes = await handleNodes(node.childNodes, params);
          }
          break;
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
          break;
        }

        case 'STYLE': {
          snapshot.childNodes = await handleNodes(node.childNodes, params);
          snapshot.sheet = await StyleSheetSnapshot.take(node.sheet, {
            requestParams, cssBox, win, platform});
          break;
        }

        case 'IMG': {
          snapshot.childNodes = await handleNodes(node.childNodes, params);
          snapshot.currentSrc = node.currentSrc;
          break;
        }

        case 'CANVAS': {
          try {
            snapshot.childNodes = [];
            snapshot.dataUrl = node.toDataURL();
          } catch(e) {
            // tained canvas etc.
          }
          break;
        }

        case 'CODE':
        case 'PRE': {
          const key = `${node.nodeName.toLowerCase()}Ancestor`;
          const newAncestorInfo = Object.assign({}, ancestorInfo, {[key]: true});
          const newParams = Object.assign({}, params, {ancestorInfo: newAncestorInfo});
          snapshot.childNodes = await handleNodes(node.childNodes, newParams);
          break;
        }

        case 'AUDIO':
        case 'VIDEO': {
          snapshot.childNodes = await handleNodes(node.childNodes, params);
          snapshot.currentSrc = node.currentSrc;
          break;
        }


        case 'TEMPLATE': {
          snapshot.childNodes = [await takeSnapshot(node.content, params)];
          break;
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
            break;
          }

          if (isCircularFrame(frameInfo, url)) {
            snapshot.childNodes = [];
            snapshot.url = url;
            snapshot.errorMessage = 'Circular frame';
            snapshot.render = 'blank';
            break;
          }

          const frame = findFrame(frameInfo, url);

          if (!frame) {
            console.info("Coundn't find frame use url: ", url);
            snapshot.childNodes = [];
            snapshot.url = url;
            snapshot.errorMessage = 'Frame not found';
            snapshot.render = 'blank';
            break;
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
            break;
          }

          if (isBrowserExtensionUrl(url)) {
            snapshot.childNodes = [];
            snapshot.errorMessage = 'Is Browser extension iframe';
            snapshot.render = 'ignore';
            break;
          }

          if (url == FRAME_URL.BLANK) {
            snapshot.childNodes = [];
            snapshot.url = url;
            snapshot.render = 'blank';
            break;
          }

          const newFrameInfo = {
            allFrames: [...frameInfo.allFrames],
            ancestors: [frame, ...frameInfo.ancestors],
          }

          if (url == FRAME_URL.SRCDOC) {
            snapshot.childNodes = [
              await takeSnapshot(
                node.contentDocument,
                Object.assign( {}, params,
                  (params.srcdocFrame || {}),
                  {frameInfo: newFrameInfo}
                )
              )
            ];
            break;
          }


          try {

            snapshot.childNodes = [];
            // take snapshot through extension message
            const extMsg = {
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

          } catch(e) {

            snapshot.childNodes = [];
            snapshot.errorMessage = e.message;
            snapshot.render = 'blank';
          }
          break;
        }

        default:
          snapshot.childNodes = await handleNodes(node.childNodes, params);
      }

      // handle style attribute
      if (node.style && node.style.length > 0) {
        snapshot.styleObj = CssTextParser.parse(node.style.cssText);
        if (cssBox && cssBox.removeUnusedRules) {
          cssBox.scope.recordReferences(node.style);
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
      let childrenParams = params;
      if (cssBox) {
        childrenParams = Object.assign({}, params, {cssBox: cssBox.change({node})});
      }
      snapshot.childNodes = await handleNodes(node.childNodes, childrenParams);
      if (cssBox) { snapshot.styleScope = cssBox.scopeToObject(); }
      break;
    }

    case NODE_TYPE.DOCUMENT_TYPE: {
      // nodeName is xxx in <!DOCTYPE xxx>
      break;
    }

    case NODE_TYPE.DOCUMENT_FRAGMENT: {
      let childrenParams = params;
      let childCssBox;

      if (node.host) {
        snapshot.isShadowRoot = true;
        snapshot.mode = node.mode;
        snapshot.docUrl = node.host.ownerDocument.location.href;
        snapshot.baseUrl = node.host.baseURI;
        if (cssBox) {
          childCssBox = cssBox.change({node});
          childrenParams = Object.assign({}, params, {cssBox: childCssBox});
        }
      }
      snapshot.childNodes = await handleNodes(node.childNodes, childrenParams);
      if (childCssBox) {
        const styleScope = childCssBox.scopeToObject();
        snapshot.styleScope = styleScope;
        if (cssBox) { cssBox.scope.addChildScope(styleScope) }
      }
      break;
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
  return snapshot;
}


/**
 * take snapshot toward ancestor nodes.
 *
 * @param {Node} node start from this element
 * @param {Array(Snapshot)} snapshots (current layer snapshots)
 * @param {CssBox} cssBox
 * @param {Function} modifier
 *
 * @return {Snapshot} it.
 */
function takeAncestorsSnapshot(lastNode, snapshots, cssBox, modifier) {
  let node;
  if (lastNode.nodeType == NODE_TYPE.DOCUMENT_FRAGMENT && lastNode.host) {
    // lastNode is shadowRoot
    node = lastNode.host;
  } else {
    node = (lastNode.assignedSlot || lastNode.parentNode);
  }

  if (node) {
    const snapshot = {name: node.nodeName, type: node.nodeType};
    switch(node.nodeType) {
      case NODE_TYPE.ELEMENT:
        snapshot.attr = handleAttrs(node);
        snapshot.childNodes = snapshots;
        if (node.shadowRoot) {
          snapshot.isShadowHost = true;
          break;
        }

        if (node.nodeName == 'SLOT') {
          snapshot.assigned = node.assignedNodes().length > 0;
          break;
        }

        // handle style attribute
        if (node.style && node.style.length > 0) {
          snapshot.styleObj = CssTextParser.parse(node.style.cssText);
          if (cssBox && cssBox.removeUnusedRules) {
            cssBox.scope.recordReferences(node.style);
          }
        }
        break;
      case NODE_TYPE.DOCUMENT:
        snapshot.childNodes = snapshots;
        snapshot.docUrl = node.location.href;
        snapshot.baseUrl = node.baseURI;
        if (cssBox) { snapshot.styleScope = cssBox.scopeToObject() }
        break;
      case NODE_TYPE.DOCUMENT_FRAGMENT:
        if (node.host) {
          snapshot.isShadowRoot = true;
          snapshot.mode = node.mode;
          snapshot.docUrl = node.host.ownerDocument.location.href;
          snapshot.baseUrl = node.host.baseURI;
          if (cssBox) { snapshot.styleScope = cssBox.scopeToObject() }
        }
        snapshot.childNodes = snapshots;
        break;
    }

    const newSnapshots = modifier(node, snapshot);
    return takeAncestorsSnapshot(node, newSnapshots, cssBox, modifier);
  } else {
    // reach the outmost node: Document.
    return snapshots[0];
  }
}



function handleAttrs(elem) {
  if (elem.hasAttributes()) {
    return Array.prototype.reduce.call(elem.attributes, (obj, attr) => {
      obj[attr.name] = attr.value;
      return obj;
    }, {});
  } else {
    return {};
  }
}


async function handleNodes(nodes, params) {
  const r = [];
  for (let i = 0; i < nodes.length; i++) {
    r.push(await takeSnapshot(nodes[i], params));
  }
  return r;
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
 * @param {Snapshot} node
 * @param {Function} fn - element handler
 * @param {[Snapshot]} ancestors - node's ancestor nodes.
 * @param {[Snapshot]} ancestorDocs - node's ancestor Document nodes.
 * @param {[Snapshot]} ancestorRoots - node's ancestor Document or ShadowRoot nodes
 */
async function eachElement(node, fn, ancestors = [], ancestorDocs = [], ancestorRoots = []) {

  switch(node.type) {

    case NODE_TYPE.ELEMENT: {
      if (node.ignore) {
        // donothing
      } else {
        const iterateChildren = await fn(node, ancestors, ancestorDocs, ancestorRoots);
        if (iterateChildren && node.childNodes && node.childNodes.length > 0) {
          const newAncestors = [node, ...ancestors];
          for (const childNode of node.childNodes) {
            await eachElement(childNode, fn, newAncestors, ancestorDocs, ancestorRoots);
          }
        }
      }
      break;
    }

    case NODE_TYPE.DOCUMENT: {
      if (node.childNodes) {
        const newAncestor = [node, ...ancestors];
        const newAncestorDocs = [node, ...ancestorDocs];
        const newAncestorRoots = [node, ...ancestorRoots];
        for (const childNode of node.childNodes) {
          await eachElement(childNode, fn, newAncestor, newAncestorDocs, newAncestorRoots);
        }
      }
      break
    }

    case NODE_TYPE.DOCUMENT_FRAGMENT: {
      if (node.childNodes) {
        const newAncestors = [node, ...ancestors];
        const newAncestorRoots = [...ancestorRoots];
        // is shadowRoot?
        if (node.host) { newAncestorRoots.unshift(node) }

        for (const childNode of node.childNodes) {
          await eachElement(childNode, fn, newAncestors, ancestorDocs, newAncestorRoots);
        }
      }
      break
    }

  }

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
 *   - {String} shadowDomRenderMethod (DeclarativeShadowDom or Tree)
 */
async function toHTML(snapshot, subHtmlHandler, params = {}) {
  const {ancestorDocs = [], shadowDomRenderMethod = 'DeclarativeShadowDom'} = params;
  const it = new SnapshotAccessor(snapshot);
  switch(it.type) {
    case NODE_TYPE.ELEMENT:
      if (it.ignore) { return ''}

      const isEmptyElement = EMPTY_ELEMENT[it.name];
      let content = '';
      if (!isEmptyElement) {
        switch(it.name) {
          case 'FRAME':
          case 'IFRAME':
            if (snapshot.render == 'ignore') { return '' }

            let subHtml = '';
            if (!snapshot.errorMessage) {
              subHtml = await children2HTML(it.childNodes, subHtmlHandler, params);
            }
            const change = await subHtmlHandler({snapshot, subHtml, ancestorDocs});
            if (change.type || change.name) {
              // is a new snapshot
              snapshot.change = change;
              return await toHTML(snapshot, subHtmlHandler, params);
            } else {
              if (change.ignore) {
                return '';
              } else {
                it.change = change;
                return `<${it.tagName}${it.getAttrHTML()}></${it.tagName}>`
              }
            }
            break;
          case 'SLOT':
            if (shadowDomRenderMethod == 'DeclarativeShadowDom') {
              if (snapshot.assigned) {
                // ChildNodes have handled in shadowRoot
                content = '';
              } else {
                content = await children2HTML(it.childNodes, subHtmlHandler, params);
              }
            } else {
              // Tree
              content = await children2HTML(it.childNodes, subHtmlHandler, params);
            }
            break;
          default:
            content = await children2HTML(it.childNodes, subHtmlHandler, params);
            break;
        }
      }

      if (isEmptyElement) {
        return `<${it.tagName}${it.getAttrHTML()}>`
      } else {
        return `<${it.tagName}${it.getAttrHTML()}>${content}</${it.tagName}>`
      }

    case NODE_TYPE.TEXT:
      return it.needEscape && escapeText(it.text) || it.text;

    case NODE_TYPE.PROCESSING_INSTRUCTION:
      break;
    case NODE_TYPE.COMMENT:
      return `<!-- ${it.text} -->`;
    case NODE_TYPE.DOCUMENT:
      {
        const newAncestorDocs = [snapshot, ...ancestorDocs];
        return await children2HTML(it.childNodes, subHtmlHandler,
          {ancestorDocs: newAncestorDocs, shadowDomRenderMethod});
      }
    case NODE_TYPE.DOCUMENT_TYPE:
      return `<!DOCTYPE ${it.name || 'html'}>\n`;
    case NODE_TYPE.DOCUMENT_FRAGMENT:
      {
        if (snapshot.isShadowRoot) {
          if (shadowDomRenderMethod == 'DeclarativeShadowDom') {
            const shadowDomHTML = await children2HTML(it.childNodes, subHtmlHandler, params);
            const lightDomHTML = await children2HTML(getAssignedNodes(snapshot), subHtmlHandler, params);
            return `<template shadowroot="${snapshot.mode}">${shadowDomHTML}</template>${lightDomHTML}`;
          } else {
            return await children2HTML(it.childNodes, subHtmlHandler, params);
          }
        } else {
          return await children2HTML(it.childNodes, subHtmlHandler, params);
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
      return it.html;
    default: return "";
  }
  return '';
}

// @see toHTML
async function children2HTML(nodes = [], subHtmlHandler, params) {
  const r = [];
  for (let i = 0; i < nodes.length; i++) {
    r.push(await toHTML(nodes[i], subHtmlHandler, params));
  }
  return r.join('');
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
  take: takeSnapshot,
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

