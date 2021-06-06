
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
import SnapshotStyleSheet from './stylesheet.js';


const ELEMENT_NAME = T.defineEnum([
  'LINK',
  'STYLE',
  'IMG',
  'CANVAS',
  'IFRAME',
  'FRAME',
  'TEMPLATE',
  'SLOT',
]);

const NODE_TYPE = T.defineEnum([
  'ELEMENT',
  'ATTRIBUTE',
  'TEXT',
  'CDATA_SECTION',
  'ENTITY_REFERENCE',
  'ENTITY',
  'PROCESSING_INSTRUCTION',
  'COMMENT',
  'DOCUMENT',
  'DOCUMENT_TYPE',
  'DOCUMENT_FRAGMENT',
  'NOTATION',
]);

const CHILD_TYPE = T.defineEnum([
  'DEFAULT',
  'DOCUMENT',
  'DOCUMENT_FRAGMENT',
  'SHADOW_ROOT',
  'SLOT',
]);


const FRAME_ERROR = T.defineEnum([
  'INVALID_URL',
  'NOT_FOUND',
  'NAVIGATION_INTERRUPTED',
  'IS_BROWSER_EXTENSION',
  'CIRCULAR',
  'CAN_NOT_CONTACT',
]);

const FRAME_URL = {
  BLANK  : 'about:blank',
  SRCDOC : 'about:srcdoc',
};

function sliceObj(obj, keys) {
  const r = {};
  for (let i = 0; i < keys.length; i++) {
    r[keys[i]] = obj[keys[i]];
  }
  return r;
}


/**
 * @param {Object} params
 * - {Window} win
 * - {RequestParams} requestParams
 * - {Object} frameInfo
 */
async function takeSnapshot(elem, params) {

  const {win, frameInfo, requestParams} = params;

  const snapshot = {name: elem.nodeName, type: elem.nodeType};

  switch(elem.nodeType) {

    case NODE_TYPE.ELEMENT:
      snapshot.attr = handleAttrs(elem);
      if (!isElemVisible(win, elem, VISIBLE_WHITE_LIST)) {
        snapshot.hidden = true;
      }

      if (elem.shadowRoot) {
        snapshot.childType = CHILD_TYPE.SHADOW_ROOT;
        // If a shadowRoot contains <slot> nodes, the assigned nodes
        // will be exist in children of shadowRoot's host.
        // We ignore these nodes.
        snapshot.childNodes = [await takeSnapshot(elem.shadowRoot, params)];
        break;
      }

      const elementName = (
          ELEMENT_NAME[elem.nodeName]
       || ELEMENT_NAME[elem.nodeName.toUpperCase()]
       || ELEMENT_NAME.UNDEFINED
      );

      switch(elementName) {
        case ELEMENT_NAME.SLOT:
          // @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement
          // Tested result:
          //   if there's no assignedNodes,
          //   it won't return the slot's fallback content.
          snapshot.childType = CHILD_TYPE.SLOT;
          const assignedNodes = await handleNodes(elem.assignedNodes(), params);
          if (assignedNodes.length > 0) {
            snapshot.childNodes = assignedNodes;
          } else {
            snapshot.childNodes = await handleNodes(elem.childNodes, params);
          }
          break;

        case ELEMENT_NAME.LINK:
          snapshot.childNodes = [];
          snapshot.state = {relList: DOMTokenList2Array(elem.relList, true)};
          if (elem.sheet) { snapshot.state.sheet = await SnapshotStyleSheet.take(elem.sheet, {requestParams, win}) }
          break;

        case ELEMENT_NAME.STYLE:
          snapshot.childNodes = await handleNodes(elem.childNodes, params);
          snapshot.state = {sheet: await SnapshotStyleSheet.take(elem.sheet, {requestParams, win})};
          break;

        case ELEMENT_NAME.IMG:
          snapshot.childNodes = await handleNodes(elem.childNodes, params);
          snapshot.state = {currentSrc: elem.currentSrc}
          break;

        case ELEMENT_NAME.CANVAS:
          try {
            snapshot.childNodes = [];
            snapshot.state = {dateUrl: elem.toDataURL()}
          } catch(e) {
            // tained canvas etc.
          }
          break;

        case ELEMENT_NAME.TEMPLATE:
          snapshot.childType = CHILD_TYPE.DOCUMENT_FRAGMENT
          snapshot.childNodes = [await takeSnapshot(elem.content, params)];
          break;

        case ELEMENT_NAME.IFRAME:
        case ELEMENT_NAME.FRAME:

          // all frame id increase in document order (Same layer)
          // frame without src and srcdoc 's url is `about:blank`
          // frame with srcdoc 's url is `about:srcdoc
          // frame at the circular end 's url is `about:blank`

          snapshot.childType = CHILD_TYPE.DOCUMENT;

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
            snapshot.state = {
              error: FRAME_ERROR.INVALID_URL,
              render: 'blank',
            };
            break;
          }

          if (isCircularFrame(frameInfo, url)) {
            snapshot.childNodes = [];
            snapshot.state = {
              error: FRAME_ERROR.CIRCULAR,
              render: 'blank',
            };
            break;
          }

          const frame = findFrame(frameInfo, url);

          if (!frame) {
            console.info("Coundn't find frame use url: ", url);
            snapshot.childNodes = [];
            snapshot.state = {
              error: FRAME_ERROR.NOT_FOUND,
              render: 'blank',
              url: url,
            };
            break;
          }

          // This assignment is nasty. It changes the parameter (params)
          frame.used = true;


          const frameObj = {
            url: frame.url,
            frameId: frame.frameId,
            parentFrameId: frame.parentFrameId
          };

          if (frame.errorOccurred) {
            snapshot.childNodes = [];
            snapshot.state = {
              error: FRAME_ERROR.NAVIGATION_INTERRUPTED,
              frame: frameObj,
              render: 'blank'
            };
            break;
          }

          snapshot.state = {frame: frameObj};

          if(isBrowserExtensionUrl(url)) {
            snapshot.childNodes = [];
            snapshot.state.error = FRAME_ERROR.IS_BROWSER_EXTENSION,
            snapshot.state.render = 'ignore';
            break;
          }

          if (url == FRAME_URL.BLANK) {
            snapshot.childNodes = [];
            snapshot.state.render = 'blank';
            break;
          }

          const newFrameInfo = {
            allFrames: [...frameInfo.allFrames],
            ancestors: [...frameInfo.ancestors, frame],
          }

          if (url == FRAME_URL.SRCDOC) {
            snapshot.childNodes = [
              await takeSnapshot(
                elem.contentDocument,
                Object.assign({}, params, {frameInfo: newFrameInfo})
              )
            ];
            break;
          }


          try {

            snapshot.childNodes = [];
            // take snapshot through extension message
            const frameSnapshot = await ExtMsg.sendToBackground({
              type: 'frame.takeSnapshot',
              body: {frameId: frame.frameId, frameInfo: newFrameInfo}
            })

            if (frameSnapshot) {
              snapshot.childNodes.push(frameSnapshot);
            } else {
              // The address wasn’t understood by Firefox
              // unknow protocol
            }

          } catch(e) {

            snapshot.childNodes = [];
            snapshot.state.error = FRAME_ERROR.CAN_NOT_CONTACT,
            snapshot.state.render = 'blank';
            snapshot.state.message = e.message;
          }
          break;

        default:
          snapshot.childNodes = await handleNodes(elem.childNodes, params);
      }

      // handle style attribute
      if (elem.style.length > 1) {
        snapshot.state = snapshot.state || {};
        snapshot.state.styleObj = CssTextParser.parse(elem.style.cssText);
      }
      break;

    case NODE_TYPE.TEXT:
    case NODE_TYPE.COMMENT:
      snapshot.text = elem.data;
      break;

    case NODE_TYPE.DOCUMENT:
      snapshot.childType = CHILD_TYPE.DOCUMENT;
      snapshot.childNodes = await handleNodes(elem.childNodes, params);
      snapshot.state = {
        docUrl: elem.location.href,
        baseUrl: elem.baseURI,
      };
      break;

    case NODE_TYPE.DOCUMENT_TYPE:
      // nodeName is xxx in <!DOCTYPE xxx>
      break;

    case NODE_TYPE.DOCUMENT_FRAGMENT:
      snapshot.childNodes = await handleNodes(elem.childNodes, params);
      break;

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
  let nextParams;
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
  const ancestorLen = frameInfo.ancestors.length;
  if (ancestorLen == 0) {
    throw new Error("findFrame: Invalid frameInfo, ancestors should not be empty");
  } else {
    const parentFrame = frameInfo.ancestors[ancestorLen - 1];
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
      return frameInfo.ancestors.findIndex((it) => it.url === url) > 0
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

/**
 * {String} name
 * {Integer} type
 * {String}  text
 * {Object} attr
 * {Boolean} hidden
 * {Array} childNodes
 * {Integer} childType
 * {Object} state
 *
 *
 */

function link(node, parentNode) {
  if (parentNode) { node.parentNode = parentNode; }
  if (node.childNodes && node.childNodes.length > 0) {
    node.childNodes.forEach((it) => link(it, node));
  }
  return node;
}

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



// ===================================

function toHTML() { return ''};
/*
function toHTML(snapshot) {
  switch(snapshot.type) {
    case Node.ELEMENT_NODE:
      let content = '';
      switch(snapshot.name) {
        case 'SLOT':
          return children2HTML(snapshot.childNodes);
        case 'FRAME':
        case 'IFRAME':
          if (snapshot.document) {
            content = toHTML(snapshot.document);
          }
          break;
        default:
          content = children2HTML(snapshot.childNodes);
          break;
      }
      const attrHTML = attrObj2HTML(snapshot.attrObj);
      const tagName = snapshot.name.toLowerCase();
      if (attrHTML.length > 0) {
        return `<${tagName} ${attrHTML}>${content}</${tagName}>`;
      } else {
        return `<${tagName}>${content}</${tagName}>`;
      }
    case Node.TEXT_NODE:
      return snapshot.text;
      break;
    case Node.PROCESSING_INSTRUCTION_NODE:
      break;
    case Node.COMMENT_NODE:
      return `<--${snapshot.text}-->`;
      break;
    case Node.DOCUMENT_NODE:
      return children2HTML(snapshot.childNodes);
    case Node.DOCUMENT_TYPE_NODE:
      return `<!DOCTYPE ${snapshot.name || 'html'}>\n`;
    case Node.DOCUMENT_FRAGMENT_NODE:
      return children2HTML(snapshot.childNodes);

    case Node.ATTRIBUTE_NODE:
    case Node.CDATA_SECTION_NODE:
    case Node.ENTITY_REFERENCE_NODE:
    case Node.ENTITY_NODE:
    case Node.NOTATION_NODE:
      // deprecated and should not be used anymore.
      break;
    default: return "";
  }
  return '';
}

function children2HTML(nodes) {
  return nodes.map((it) => toHTML(it)).join('');
}

function attrObj2HTML(attrObj) {
  const items = [];
  for (let name in attrObj) {
    items.push(`${name}="${attrObj[name]}`);
  }
  return items.join(' ');
}
*/

export default Object.assign({take: takeSnapshot}, {link, each, toHTML});

