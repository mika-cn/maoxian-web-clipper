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
import CapturerIframe        from '../capturer/iframe.js';
import CapturerCustomElement from '../capturer/custom-element.js';
import StyleHelper           from './style-helper.js';


async function clip(elem, {info, storageInfo, config, i18nLabel, win}){
  Log.debug("html parser");

  const [mimeTypeDict, frames] = await Promise.all([
    ExtMsg.sendToBackend('clipping', {type: 'get.mimeTypeDict'}),
    ExtMsg.sendToBackend('clipping', {type: 'get.allFrames'}),
  ])

  const headerParams = {
    refUrl         : win.location.href,
    userAgent      : win.navigator.userAgent,
    referrerPolicy : config.requestReferrerPolicy,
  }

  const isBodyElem = elem.tagName.toUpperCase() === 'BODY';

  const {elemHtml, headInnerHtml, tasks} = await getElemHtml({
    clipId       : info.clipId,
    frames       : frames,
    storageInfo  : storageInfo,
    elem         : elem,
    docUrl       : win.location.href,
    baseUrl      : win.document.baseURI,
    mimeTypeDict : mimeTypeDict,
    config       : config,
    headerParams : headerParams,
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
    task.headers = CaptureTool.getRequestHeaders(task.url, headerParams);
    task.timeout = config.requestTimeout;
    task.tries = config.requestMaxTries;
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
    mimeTypeDict,
    parentFrameId = topFrameId,
    config,
    headerParams,
    needFixStyle,
    win,
  } = params;
  Log.debug('getElemHtml', baseUrl);

  const {customElementHtmlDict, customElementStyleDict, customElementTasks} = await captureCustomElements(params);

  const KLASS = ['mx-wc', clipId].join('-');
  elem.classList.add('mx-wc-selected-elem');
  elem.classList.add(KLASS);
  DOMTool.markHiddenNode(win, elem);
  const docHtml = win.document.documentElement.outerHTML;
  elem.classList.remove('mx-wc-selected-elem');
  elem.classList.remove(KLASS);
  DOMTool.clearHiddenMark(elem);

  const {doc} = DOMTool.parseHTML(win, docHtml);
  let selectedNode = doc.querySelector('.' + KLASS);
  selectedNode.classList.remove(KLASS);
  selectedNode = DOMTool.removeNodeByHiddenMark(selectedNode);

  const {node, taskCollection} = await captureContainerNode(selectedNode,
    Object.assign({}, params, {doc, customElementHtmlDict, customElementStyleDict}));
  selectedNode = node;

  taskCollection.push(...customElementTasks);

  // capture head nodes that haven't processed.
  const headNodes = doc.querySelectorAll('style, link');
  const processedNodes = selectedNode.querySelectorAll('style, link');

  for (let i = 0; i < headNodes.length; i++) {
    const currNode = headNodes[i];
    if ([].indexOf.call(processedNodes, currNode) == -1) {
      const r = await captureNode(currNode, Object.assign({}, params, {doc}));
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
    const r = await captureContainerNode(node, Object.assign({}, params, {storageInfo, doc}));

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
    mimeTypeDict,
    customElementHtmlDict = {},
    customElementStyleDict = {},
    parentFrameId = topFrameId,
    config,
    headerParams,
    needFixStyle,
    win,
    doc,
  } = params;

  let opts = {};
  let r = {node: node, tasks: []}
  switch (node.tagName.toUpperCase()) {
    case 'LINK':
      opts = {baseUrl, docUrl, storageInfo, clipId,
        mimeTypeDict, config, headerParams, needFixStyle};
      r = await CapturerLink.capture(node, opts);
      break;
    case 'STYLE':
      opts = {baseUrl, docUrl, storageInfo, clipId,
        mimeTypeDict, config, headerParams, needFixStyle};
      r = await CapturerStyle.capture(node, opts);
      break;
    case 'PICTURE':
      opts = {baseUrl, storageInfo, clipId, mimeTypeDict};
      r = await CapturerPicture.capture(node, opts);
      break;
    case 'IMG':
      opts = {saveFormat, baseUrl, storageInfo, clipId, mimeTypeDict};
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
      opts = {baseUrl, storageInfo, config, clipId, mimeTypeDict};
      r = CaptureTool.captureBackgroundAttr(node, opts);
      break;
    case 'AUDIO':
    case 'VEDIO':
    case 'EMBED':
    case 'OBJECT':
    case 'APPLET':
    case 'CANVAS':
      // Don't capture media nodes.
      node.setAttribute('data-mx-ignore-me', 'true');
      r.node = node;
      break;
    case 'IFRAME':
    case 'FRAME':
      opts = {saveFormat, baseUrl, doc, storageInfo,
        clipId, mimeTypeDict, config, parentFrameId, frames};
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
  [].forEach.call(r.node.attributes, async (attr) => {
    const attrName = attr.name.toLowerCase();

    // remove event listener
    if (attrName.startsWith('on')) {
      r.node.removeAttribute(attrName);
    }

    // inline style
    if (attrName === 'style') {
      const {cssText, tasks} = await CapturerCss.captureText(
        Object.assign({
          text: attr.value
        }, {
          baseUrl, docUrl, storageInfo, clipId,
          mimeTypeDict, config, headerParams,
          needFixStyle
        })
      );
      r.node.setAttribute('style', cssText);
      r.tasks.push(...tasks);
    }

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
