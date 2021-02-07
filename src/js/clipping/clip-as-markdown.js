"use strict";

import T                     from '../lib/tool.js';
import DOMTool               from '../lib/dom-tool.js';
import Log                   from '../lib/log.js';
import ExtMsg                from '../lib/ext-msg.js';
import Task                  from '../lib/task.js';
import MdPluginCode          from '../lib/md-plugin-code.js';
import MdPluginMathJax       from '../lib/md-plugin-mathjax.js';
import MdPluginMathML2LaTeX  from '../lib/md-plugin-mathml2latex.js';
import CaptureTool           from '../capturer/tool.js';
import CapturerA             from '../capturer/a.js';
import CapturerImg           from '../capturer/img.js';
import CapturerCanvas        from '../capturer/canvas.js';
import CapturerIframe        from '../capturer/iframe.js';
import CapturerCustomElement from '../capturer/custom-element.js';

import TurndownService from 'turndown';
const turndownPluginGfm = require('turndown-plugin-gfm');


async function clip(elem, {info, storageInfo, config, i18nLabel, requestParams, frames, win}){
  Log.debug("markdown parser");

  const {elemHtml, tasks} = await getElemHtml({
    clipId       : info.clipId,
    frames       : frames,
    storageInfo  : storageInfo,
    elem         : elem,
    docUrl       : win.location.href,
    baseUrl      : win.document.baseURI,
    config       : config,
    requestParams: requestParams,
    win          : win,
  })
  let markdown = generateMarkDown(elemHtml, info);
  markdown = MdPluginMathJax.unEscapeMathJax(markdown);
  markdown = MdPluginMathML2LaTeX.unEscapeLaTex(markdown);
  if (config.mdFrontMatterEnabled) {
    const v = Object.assign({}, info, i18nLabel);
    markdown = [
      generateMdFrontMatter(config.mdFrontMatterTemplate, v),
      markdown
    ].join("\n\n");
  }
  if (config.mdSaveClippingInformation){
    const v = Object.assign({}, info, i18nLabel);
    markdown += generateMdClippingInfo(v);
  }
  const filename = T.joinPath(storageInfo.mainFileFolder, storageInfo.mainFileName);
  const mainFileTask = Task.createMarkdownTask(filename, markdown, info.clipId);
  tasks.push(mainFileTask);

  return Task.changeUrlTask(tasks, (task) => {
    task.headers = requestParams.getHeaders(task.url);
    task.timeout = requestParams.timeout;
    task.tries   = requestParams.tries;
  });
}

async function getElemHtml(params){
  const topFrameId = 0, saveFormat = 'md';
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
    win,
  } = params;
  Log.debug("getElemHtml", docUrl);

  const {customElementHtmlDict, customElementTasks} = await captureCustomElements(params);
  const canvasDataUrlDict = preprocessCanvasElements(elem);

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
    Object.assign({}, params, {doc, customElementHtmlDict, canvasDataUrlDict}));
  selectedNode = node;

  taskCollection.push(...customElementTasks);

  selectedNode = MdPluginCode.handle(doc, selectedNode);
  selectedNode = MdPluginMathJax.handle(doc, selectedNode);
  selectedNode = MdPluginMathML2LaTeX.handle(doc, selectedNode);

  let elemHtml = selectedNode.outerHTML;
  return {elemHtml: elemHtml, tasks: taskCollection};
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

async function captureCustomElements(params) {
  const {elem, win} = params;
  const customElementHtmlDict = {};
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

    const canvasDataUrlDict = preprocessCanvasElements(it.shadowRoot);
    DOMTool.markHiddenNode(win, it.shadowRoot);
    const docHtml = `<mx-tmp-root>${it.shadowRoot.innerHTML}</mx-tmp-root>`;
    DOMTool.clearHiddenMark(it);
    const {doc, node: rootNode} = DOMTool.parseHTML(win, docHtml);
    let node = DOMTool.removeNodeByHiddenMark(rootNode);
    const r = await captureContainerNode(node, Object.assign({}, params, {doc, canvasDataUrlDict}));

    const id = T.createId();
    it.setAttribute('data-mx-custom-element-id', id);
    customElementHtmlDict[id] = r.node.innerHTML;
    customElementTasks.push(...r.taskCollection);
  }
  return {customElementHtmlDict, customElementTasks};
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
  const topFrameId = 0, saveFormat = 'md';
  const {
    clipId,
    frames,
    storageInfo,
    canvasDataUrlDict = {},
    customElementHtmlDict = {},
    parentFrameId = topFrameId,
    baseUrl,
    docUrl,
    config,
    requestParams,
    doc,
  } = params;
  let opts = {};
  let r = {node: node, tasks: []}
  switch (node.tagName.toUpperCase()) {
    case 'IMG':
      opts = {saveFormat, baseUrl, storageInfo, clipId, requestParams};
      r = await CapturerImg.capture(node, opts);
      break;
    case 'A':
      opts = {baseUrl, docUrl};
      r = await CapturerA.capture(node, opts);
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
        opts = {saveFormat, clipId, storageInfo, doc, customElementHtmlDict};
        r = CapturerCustomElement.capture(node, opts);
      }
      break;
  }
  return r;
}

function generateMarkDown(elemHtml, info){
  Log.debug('generateMarkDown');
  const turndownService = getTurndownService();
  let md = "";
  if (!elemHtml.match(/<h1[\s>]{1}/i)) {
    md += `\n# ${info.title}\n\n`;
  }
  md += turndownService.turndown(elemHtml);
  return md;
}

function generateMdClippingInfo(v) {
  Log.debug('generateMdClippingInfo');
  let md = ""
  md += "\n\n---------------------------------------------------\n"
  md += `\n\n${v.i18n_original_url}: [${v.i18n_access}](${v.link})`;
  md += `\n\n${v.i18n_created_at}: ${v.created_at}`;
  let categoryStr = v.i18n_none;
  let tagStr = v.i18n_none
  if(v.category){
    categoryStr = v.category
  }
  if(v.tags.length > 0){
    tagStr = T.map(v.tags, function(tag){
      return "`" + tag + "`";
    }).join(", ");
  }
  md += `\n\n${v.i18n_category}: ${categoryStr}`;
  md += `\n\n${v.i18n_tags}: ${tagStr}`;
  md += "\n\n";
  return md
}

function generateMdFrontMatter(template, v) {
  let category = v.i18n_none;
  let tags = "\n- " + v.i18n_none;
  if(v.category){
    category = v.category
  }
  if(v.tags.length > 0){
    tags = "\n" + T.map(v.tags, function(tag){
      return `  - ${tag}`
    }).join("\n");
  }
  const tObj = T.wrapDate(new Date(v.created_at));
  return T.renderTemplate(template, Object.assign({
    title: (v.title || "-"),
    url: v.link,
    createdAt: v.created_at,
    category: category,
    tags: tags
  }, tObj.str));
}

function getTurndownService(){
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  service.use([
    turndownPluginGfm.tables,
    turndownPluginGfm.strikethrough
  ]);
  service.addRule('ignoreTag', {
    filter: ['style', 'script', 'noscript', 'noframes', 'canvas', 'template'],
    replacement: function(content, node, options){return ''}
  })
  return service;
}

export default {clip, getElemHtml};
