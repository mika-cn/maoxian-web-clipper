"use strict";

import I18N                  from '../lib/translation.js';
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
import CapturerIframe        from '../capturer/iframe.js';
import CapturerCustomElement from '../capturer/custom-element.js';

import TurndownService from 'turndown';
const turndownPluginGfm = require('turndown-plugin-gfm');


async function clip(elem, {info, storageInfo, config, win}){
  Log.debug("markdown parser");

  const [mimeTypeDict, frames] = await Promise.all([
    ExtMsg.sendToBackend('clipping', {type: 'get.mimeTypeDict'}),
    ExtMsg.sendToBackend('clipping', {type: 'get.allFrames'}),
  ]);

  const headerParams = {
    refUrl         : win.location.href,
    userAgent      : win.navigator.userAgent,
    referrerPolicy : config.requestReferrerPolicy,
  }


  const {elemHtml, tasks} = await getElemHtml({
    clipId       : info.clipId,
    frames       : frames,
    storageInfo  : storageInfo,
    elem         : elem,
    docUrl       : win.location.href,
    baseUrl      : win.document.baseURI,
    mimeTypeDict : mimeTypeDict,
    config       : config,
    win          : win,
  })
  let markdown = generateMarkDown(elemHtml, info);
  markdown = MdPluginMathJax.unEscapeMathJax(markdown);
  markdown = MdPluginMathML2LaTeX.unEscapeLaTex(markdown);
  if (config.mdFrontMatterEnabled) {
    markdown = [
      generateMdFrontMatter(info, config.mdFrontMatterTemplate),
      markdown
    ].join("\n\n");
  }
  if (config.mdSaveClippingInformation){
    markdown += generateMdClippingInfo(info);
  }
  const filename = T.joinPath(storageInfo.mainFileFolder, storageInfo.mainFileName);
  const mainFileTask = Task.createMarkdownTask(filename, markdown, info.clipId);
  tasks.push(mainFileTask);

  return Task.changeUrlTask(tasks, (task) => {
    task.headers = CaptureTool.getRequestHeaders(task.url, headerParams);
    task.timeout = config.requestTimeout;
    task.tries = config.requestMaxTries;
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
    mimeTypeDict,
    parentFrameId = topFrameId,
    config,
    win,
  } = params;
  Log.debug("getElemHtml", docUrl);

  const {customElementHtmlDict, customElementTasks} = await captureCustomElements(params);

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
    Object.assign({}, params, {doc, customElementHtmlDict}));
  selectedNode = node;

  taskCollection.push(...customElementTasks);

  selectedNode = MdPluginCode.handle(doc, selectedNode);
  selectedNode = MdPluginMathJax.handle(doc, selectedNode);
  selectedNode = MdPluginMathML2LaTeX.handle(doc, selectedNode);

  let elemHtml = selectedNode.outerHTML;
  return {elemHtml: elemHtml, tasks: taskCollection};
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

    DOMTool.markHiddenNode(win, it.shadowRoot);
    const docHtml = `<mx-tmp-root>${it.shadowRoot.innerHTML}</mx-tmp-root>`;
    DOMTool.clearHiddenMark(it);
    const {doc, node: rootNode} = DOMTool.parseHTML(win, docHtml);
    let node = DOMTool.removeNodeByHiddenMark(rootNode);
    const r = await captureContainerNode(node, Object.assign({}, params, {doc}));

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
    mimeTypeDict,
    customElementHtmlDict = {},
    parentFrameId = topFrameId,
    baseUrl,
    docUrl,
    config,
    doc,
  } = params;
  let opts = {};
  let r = {node: node, tasks: []}
  switch (node.tagName.toUpperCase()) {
    case 'IMG':
      opts = {saveFormat, baseUrl, storageInfo, clipId, mimeTypeDict};
      r = await CapturerImg.capture(node, opts);
      break;
    case 'A':
      opts = {baseUrl, docUrl};
      r = await CapturerA.capture(node, opts);
      break;
    case 'IFRAME':
    case 'FRAME':
      opts = {saveFormat, baseUrl, doc, storageInfo,
        clipId, mimeTypeDict, config, parentFrameId, frames};
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

function generateMdClippingInfo(info) {
  Log.debug('generateMdClippingInfo');
  let md = ""
  md += "\n\n---------------------------------------------------\n"
  md += `\n\n${I18N.t('original-url')}: [${I18N.t('access')}](${info.link})`;
  md += `\n\n${I18N.t('created-at')}: ${info.created_at}`;
  let categoryStr = I18N.t('none');
  let tagStr = I18N.t('none');
  if(info.category){
    categoryStr = info.category
  }
  if(info.tags.length > 0){
    tagStr = T.map(info.tags, function(tag){
      return "`" + tag + "`";
    }).join(", ");
  }
  md += `\n\n${I18N.t('category')}: ${categoryStr}`;
  md += `\n\n${I18N.t('tags')}: ${tagStr}`;
  md += "\n\n";
  return md
}

function generateMdFrontMatter(info, template) {
  let category = I18N.t('none');
  let tags = "\n- " + I18N.t('none');
  if(info.category){
    category = info.category
  }
  if(info.tags.length > 0){
    tags = "\n" + T.map(info.tags, function(tag){
      return `  - ${tag}`
    }).join("\n");
  }
  const tObj = T.wrapDate(new Date(info.created_at));
  const v = Object.assign({
    title: (info.title || "-"),
    url: info.link,
    createdAt: info.created_at,
    category: category,
    tags: tags
  }, tObj.str);
  return T.renderTemplate(template, v);
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
