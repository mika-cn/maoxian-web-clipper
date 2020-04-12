  "use strict";

  import I18N from '../lib/translation.js';
  import T from '../lib/tool.js';
  import DOMTool from '../lib/dom-tool.js';
  import Log from '../lib/log.js';
  import ExtMsg from '../lib/ext-msg.js';
  import Task from '../lib/task.js';
  import MdPluginCode from '../lib/md-plugin-code.js';
  import MdPluginMathJax from '../lib/md-plugin-mathjax.js';
  import MdPluginMathML2LaTeX from '../lib/md-plugin-mathml2latex.js';
  import CaptureTool from '../capturer/tool.js';
  import CapturerA from '../capturer/a.js';
  import CapturerImg from '../capturer/img.js';
  import CapturerIframe from '../capturer/iframe.js';

  // require turndownservice
  import TurndownService from 'turndown';
  const turndownPluginGfm = require('turndown-plugin-gfm');

  /*
   * @param {Object} params
   */
  async function parse(params){
    Log.debug("markdown parser");
    const {storageInfo, elem, info, config} = params;
    const [mimeTypeDict, frames] = await Promise.all([
      ExtMsg.sendToBackground({type: 'get.mimeTypeDict'}),
      ExtMsg.sendToBackground({type: 'get.allFrames'}),
    ]);

    const headerParams = {
      refUrl: window.location.href,
      userAgent: window.navigator.userAgent,
      referrerPolicy: config.requestReferrerPolicy,
    }


    const {elemHtml, tasks} = await getElemHtml({
      clipId: info.clipId,
      frames: frames,
      storageInfo: storageInfo,
      elem: elem,
      docUrl: window.location.href,
      baseUrl: window.document.baseURI,
      mimeTypeDict: mimeTypeDict,
      config: config,
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
      task['headers'] = CaptureTool.getRequestHeaders(
        task.url, headerParams);
      task['timeout'] = config.requestTimeout;
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
    } = params;
    Log.debug("getElemHtml", docUrl);


    const KLASS = ['mx-wc', clipId].join('-');
    elem.classList.add('mx-wc-selected-elem');
    elem.classList.add(KLASS);
    DOMTool.markHiddenNode(window, elem);
    const docHtml = document.documentElement.outerHTML;
    elem.classList.remove('mx-wc-selected-elem');
    elem.classList.remove(KLASS);
    DOMTool.clearHiddenMark(elem);


    const {doc} = DOMTool.parseHTML(window, docHtml);
    let selectedNode = doc.querySelector('.' + KLASS);
    selectedNode.classList.remove(KLASS);
    selectedNode = DOMTool.removeNodeByHiddenMark(selectedNode);

    const aNodes       = DOMTool.querySelectorIncludeSelf(selectedNode, 'a');
    const imgNodes     = DOMTool.querySelectorIncludeSelf(selectedNode, 'img');
    const iframeNodes  = DOMTool.querySelectorIncludeSelf(selectedNode, 'iframe');
    const frameNodes   = DOMTool.querySelectorIncludeSelf(selectedNode, 'frame');

    const captureInfos = [
      {
        nodes: imgNodes,
        capturer: CapturerImg,
        opts: {saveFormat, baseUrl, storageInfo, clipId, mimeTypeDict}
      },
      {
        nodes: aNodes,
        capturer: CapturerA,
        opts: {baseUrl, docUrl}
      },
      {
        nodes: iframeNodes,
        capturer: CapturerIframe,
        opts: {saveFormat, baseUrl, doc, storageInfo, clipId, mimeTypeDict, config, parentFrameId, frames}
      },
      {
        nodes: frameNodes,
        capturer: CapturerIframe,
        opts: {saveFormat, baseUrl, doc, storageInfo, clipId, mimeTypeDict, config, parentFrameId, frames}
      }
    ];

    const taskCollection = [];

    for (let i = 0; i < captureInfos.length; i++) {
      const it = captureInfos[i];
      for (let j = 0; j < it.nodes.length; j++) {
        const node = it.nodes[j];
        if (node === selectedNode) {
          const r = await it.capturer.capture(node, it.opts);
          taskCollection.push(...r.tasks);
          selectedNode = r.node;
        } else {
          const r = await it.capturer.capture(node, it.opts);
          taskCollection.push(...r.tasks);
        }
      }
    }


    selectedNode = MdPluginCode.handle(doc, selectedNode);
    selectedNode = MdPluginMathJax.handle(doc, selectedNode);
    selectedNode = MdPluginMathML2LaTeX.handle(doc, selectedNode);

    let elemHtml = selectedNode.outerHTML;
    return {elemHtml: elemHtml, tasks: taskCollection};
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

  const Markdown = {
    parse: parse,
    getElemHtml: getElemHtml
  }

  export default Markdown;