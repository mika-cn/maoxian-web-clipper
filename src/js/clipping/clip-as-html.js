"use strict";

import T                     from '../lib/tool.js';
import DOMTool               from '../lib/dom-tool.js';
import Log                   from '../lib/log.js';
import ExtMsg                from '../lib/ext-msg.js';
import Task                  from '../lib/task.js';
import Template              from '../lib/template.js';
import CaptureTool           from '../capturer/tool.js';
import CapturerA             from '../capturer/a.js';
import CapturerPicture       from '../capturer/picture.js';
import CapturerImg           from '../capturer/img.js';
import CapturerCss           from '../capturer/css.js';
import CapturerStyle         from '../capturer/style.js';
import CapturerLink          from '../capturer/link.js';
import CapturerCanvas        from '../capturer/canvas.js';
import CapturerIframe        from '../capturer/iframe.js';
import CapturerCustomElement from '../capturer/custom-element.js';
import StyleHelper           from './style-helper.js';


async function clip(elem, {info, storageInfo, config, i18nLabel, requestParams, frames, win}){
  Log.debug("html parser");

  const isBodyElem = elem.tagName.toUpperCase() === 'BODY';

  const {elemHtml, headInnerHtml, tasks} = await getElemHtml({
    clipId       : info.clipId,
    frames       : frames,
    storageInfo  : storageInfo,
    elem         : elem,
    docUrl       : win.location.href,
    baseUrl      : win.document.baseURI,
    config       : config,
    requestParams : requestParams,
    needFixStyle : !isBodyElem,
    win          : win,
  });

  // render elemHtml into template
  const v = StyleHelper.getRenderParams(elem, win);
  const page = (isBodyElem ? 'bodyPage' : 'elemPage');
  v.info = info;
  v.headInnerHtml = headInnerHtml;
  v.elemHtml = elemHtml;
  v.config = config;
  const html = Template[page].render(Object.assign({}, v, i18nLabel));
  const filename = T.joinPath(storageInfo.mainFileFolder, storageInfo.mainFileName)

  const mainFileTask = Task.createHtmlTask(filename, html, info.clipId);
  tasks.push(mainFileTask);

  return Task.changeUrlTask(tasks, (task) => {
    task.headers = requestParams.getHeaders(task.url);
    task.timeout = requestParams.timeout;
    task.tries   = requestParams.tries;
  });
}


async function getElemHtml(params){
  const topFrameId = 0, saveFormat = 'html';
  const {
    clipId,
    frames,
    storageInfo,
    elem,
    baseUrl,
    docUrl,
    parentFrameId = topFrameId,
    config,
    requestParams,
    needFixStyle,
    win,
  } = params;
  Log.debug('getElemHtml', baseUrl);

  const {customElementHtmlDict, customElementStyleDict, customElementTasks} = await captureCustomElements(params);
  const canvasDataUrlDict = preprocessCanvasElements(elem);
  const cssRulesDict = collectCssRules(win.document.documentElement);

  const KLASS = ['mx-wc', clipId].join('-');
  elem.classList.add('mx-wc-selected-elem');
  elem.classList.add(KLASS);
  DOMTool.markHiddenNode(win, elem);
  const docHtml = win.document.documentElement.outerHTML;
  elem.classList.remove('mx-wc-selected-elem');
  elem.classList.remove(KLASS);
  DOMTool.clearHiddenMark(elem);
  DOMTool.removeMxMarker(win.document.documentElement);

  const {doc} = DOMTool.parseHTML(win, docHtml);
  let selectedNode = doc.querySelector('.' + KLASS);
  selectedNode.classList.remove(KLASS);
  selectedNode = DOMTool.removeNodeByHiddenMark(selectedNode);

  const {node, taskCollection} = await captureContainerNode(selectedNode,
    Object.assign({}, params, {
      doc,
      customElementHtmlDict,
      customElementStyleDict,
      canvasDataUrlDict,
      cssRulesDict,
    })
  );

  selectedNode = node;
  taskCollection.push(...customElementTasks);

  // capture head nodes that haven't processed.
  const headNodes = doc.querySelectorAll('style, link');
  const processedNodes = selectedNode.querySelectorAll('style, link');

  for (let i = 0; i < headNodes.length; i++) {
    const currNode = headNodes[i];
    if ([].indexOf.call(processedNodes, currNode) == -1) {
      const r = await captureNode(currNode, Object.assign({}, params, {doc, cssRulesDict}));
      taskCollection.push(...r.tasks);
    }
  }
  const headInnerHtml = getNodesHtml(
    doc.querySelectorAll('link[rel*=icon],link[rel~=stylesheet],style'));

  let elemHtml = "";
  if(elem.tagName.toUpperCase() === 'BODY') {
    elemHtml = dealBodyElem(selectedNode, elem);
  } else {
    elemHtml = dealNormalElem(selectedNode, elem, win);
  }
  return { elemHtml: elemHtml, headInnerHtml: headInnerHtml, tasks: taskCollection };
}

/**
 *
 * Canvas nodes can not be clone without losing it's data.
 * So we process it before we clone the whole document.
 *
 * @param {Element} contextNode
 *
 * @return {Object} dict (id => dataUrl)
 */
function preprocessCanvasElements(contextNode) {
  const nodes = DOMTool.querySelectorIncludeSelf(contextNode, 'canvas');
  const dict = {};
  [].forEach.call(nodes, (it) => {
    try {
      const dataUrl = it.toDataURL();
      const id = T.createId();
      it.setAttribute('data-mx-id', id);
      it.setAttribute('data-mx-marker', 'canvas-image');
      dict[id] = dataUrl;
    } catch(e) {
      // tained canvas etc.
    }
  });
  return dict;
}


/**
 * There are some rules that generage by javascript (using CSSOM)
 * These rules are weired, you can find them in devTool as inline style,
 * but you can't find them in the html source...
 *
 * In order to obtain these rules, we collect them.
 *
 * @param {Element} contextNode
 *
 * @return {Object} dict (id => cssRules)
 */
function collectCssRules(contextNode) {
  const nodes = contextNode.querySelectorAll('style');
  const dict = {};
  [].forEach.call(nodes, (it) => {
    try {
      const id = T.createId();
      it.setAttribute('data-mx-id', id);
      it.setAttribute('data-mx-marker', 'css-rules');
      dict[id] = it.sheet.cssRules
    } catch(e) {}
  });
  return dict;
}

async function captureCustomElements(params) {
  const {elem, win} = params;
  const customElementHtmlDict = {};
  const customElementStyleDict = {};
  const customElementTasks = [];

  const nodeIterator = win.document.createNodeIterator(
    elem, win.NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (it) => {
        if (it.shadowRoot) {
          return win.NodeFilter.FILTER_ACCEPT;
        } else {
          return win.NodeFilter.FILTER_REJECT;
        }
      }
    }
  );

  let it;
  while(it = nodeIterator.nextNode()) {

    const box = it.getBoundingClientRect();
    const cssRulesDict = collectCssRules(it.shadowRoot);
    const canvasDataUrlDict = preprocessCanvasElements(it.shadowRoot);
    DOMTool.markHiddenNode(win, it.shadowRoot);
    const docHtml = `<mx-tmp-root>${it.shadowRoot.innerHTML}</mx-tmp-root>`;
    DOMTool.clearHiddenMark(it);
    const {doc, node: rootNode} = DOMTool.parseHTML(win, docHtml);
    let node = DOMTool.removeNodeByHiddenMark(rootNode);
    const storageInfo = Object.assign({}, params.storageInfo, {
      assetRelativePath: T.calcPath(
        params.storageInfo.frameFileFolder,
        params.storageInfo.assetFolder
      )
    });
    const r = await captureContainerNode(node, Object.assign({}, params, {storageInfo, doc, cssRulesDict, canvasDataUrlDict}));

    const id = T.createId();
    it.setAttribute('data-mx-custom-element-id', id);
    customElementHtmlDict[id] = r.node.innerHTML;
    customElementStyleDict[id] = {width: box.width, height: box.height};
    customElementTasks.push(...r.taskCollection);
  }
  return {customElementHtmlDict, customElementStyleDict, customElementTasks};
}


async function captureContainerNode(containerNode, params) {

  const taskCollection = [];
  const childNodes = containerNode.querySelectorAll('*');
  for (let i = 0; i < childNodes.length; i++) {
    const r = await captureNode(childNodes[i], params);
    taskCollection.push(...r.tasks);
  }

  const r = await captureNode(containerNode, params);
  taskCollection.push(...r.tasks);
  containerNode = r.node;

  return {node: containerNode, taskCollection: taskCollection};
}

/**
 * @return {:node, :tasks}
 */
async function captureNode(node, params) {
  const topFrameId = 0, saveFormat = 'html';
  const {
    clipId,
    frames,
    storageInfo,
    elem,
    baseUrl,
    docUrl,
    cssRulesDict,
    canvasDataUrlDict = {},
    customElementHtmlDict = {},
    customElementStyleDict = {},
    parentFrameId = topFrameId,
    config,
    requestParams,
    needFixStyle,
    win,
    doc,
  } = params;

  let opts = {};
  let r = {node: node, tasks: []}
  switch (node.tagName.toUpperCase()) {
    case 'LINK':
      opts = {baseUrl, docUrl, storageInfo, clipId,
        config, requestParams, needFixStyle};
      r = await CapturerLink.capture(node, opts);
      break;
    case 'STYLE':
      opts = {baseUrl, docUrl, storageInfo, clipId,
        cssRulesDict, config, requestParams, needFixStyle};
      r = await CapturerStyle.capture(node, opts);
      break;
    case 'PICTURE':
      opts = {baseUrl, storageInfo, clipId, requestParams};
      r = await CapturerPicture.capture(node, opts);
      break;
    case 'IMG':
      opts = {saveFormat, baseUrl, storageInfo, clipId, requestParams};
      r = await CapturerImg.capture(node, opts);
      break;
    case 'A':
      opts = {baseUrl, docUrl};
      r = await CapturerA.capture(node, opts);
      break;
    case 'BODY':
    case 'TABLE':
    case 'TH':
    case 'TD':
      // background attribute (deprecated since HTML5)
      opts = {baseUrl, storageInfo, config, clipId, requestParams};
      r = await CaptureTool.captureBackgroundAttr(node, opts);
      break;
    case 'AUDIO':
    case 'VEDIO':
    case 'EMBED':
    case 'OBJECT':
    case 'APPLET':
      // Don't capture media nodes.
      node.setAttribute('data-mx-ignore-me', 'true');
      r.node = node;
      break;
    case 'CANVAS':
      opts = {saveFormat, storageInfo, clipId, canvasDataUrlDict, doc};
      r = CapturerCanvas.capture(node, opts);
      break;
    case 'IFRAME':
    case 'FRAME':
      opts = {saveFormat, baseUrl, doc, storageInfo,
        clipId, config, parentFrameId, frames};
      r = await CapturerIframe.capture(node, opts);
      break;
    default:
      if (node.hasAttribute('data-mx-custom-element-id')) {
        opts = {saveFormat, clipId, storageInfo, doc, customElementHtmlDict, customElementStyleDict};
        r = CapturerCustomElement.capture(node, opts);
      }
      break;
  }

  // handle global attributes
  const attrsToRemove = [];
  const len = r.node.attributes.length;
  for (let i=0; i < len; i++) {
    const attr = r.node.attributes[i];
    const attrName = attr.name.toLowerCase();

    // remove event listener
    if (attrName.startsWith('on')) {
      attrsToRemove.push(attrName);
    }

    // inline style
    if (attrName === 'style') {
      if (r.node.hasAttribute('data-mx-dont-capture-style')) {
        attrsToRemove.push('data-mx-dont-capture-style');
      } else {
        const {cssText, tasks} = await CapturerCss.captureText(
          Object.assign({
            text: attr.value
          }, {
            baseUrl, docUrl, storageInfo, clipId,
            config, requestParams,
            needFixStyle
          })
        );
        r.node.setAttribute('style', cssText);
        r.tasks.push(...tasks);
      }
    }
  }
  attrsToRemove.forEach((attrName) => {
    r.node.removeAttribute(attrName);
  })

  return r;
}


function dealBodyElem(node, originalNode) {
  node = removeUselessNode(node);
  return node.outerHTML;
}

function dealNormalElem(node, originalNode, win){
  node.style = StyleHelper.getSelectedNodeStyle(originalNode, win);
  node = removeUselessNode(node);
  return wrapToBody(originalNode, node.outerHTML);
}

function removeUselessNode(contextNode){
  return DOMTool.removeNodeBySelectors(contextNode, [
    'link',
    'style',
    'script',
    'template',
    '*[data-mx-ignore-me="true"]'
  ]);
}

/* wrap to body element */
function wrapToBody(elem, html){
  let pElem = elem.parentElement;
  while(pElem && ['HTML', 'BODY'].indexOf(pElem.tagName.toUpperCase()) == -1){
    const tagName = pElem.tagName

    const attrs = [];
    T.each(pElem.attributes, function(attr){
      if(attr.name !== "style"){
        attrs.push([attr.name, attr.value]);
      }
    });
    attrs.push(['style', StyleHelper.getWrapperStyle(pElem)]);
    const attrHtml = T.map(attrs, function(pair){
      return `${pair[0]}="${pair[1]}"`;
    }).join(' ');
    html = `<${tagName} ${attrHtml}>${html}</${tagName}>`;
    pElem = pElem.parentElement;
  }
  return html;
}


function getNodesHtml(nodes) {
  const outerHtmls = [];
  [].forEach.call(nodes, (node) => {
    if (!node.hasAttribute('data-mx-ignore-me')) {
      outerHtmls.push(node.outerHTML);
    }
  });

  return outerHtmls.length === 0 ? '' : ['', ...outerHtmls, ''].join('\n');
}


export default {clip, getElemHtml};
