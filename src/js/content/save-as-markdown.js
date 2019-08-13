;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/translation.js'),
      require('../lib/tool.js'),
      require('../lib/dom-tool.js'),
      require('../lib/log.js'),
      require('../lib/ext-msg.js'),
      require('../lib/task.js'),
      require('../lib/md-plugin-gist.js'),
      require('../lib/md-plugin-misc.js'),
      require('../lib/md-plugin-mathjax.js'),
      require('../lib/md-plugin-mathml2latex.js'),
      require('../capturer/a.js'),
      require('../capturer/img.js'),
      require('../capturer/iframe.js'),
   );
  } else {
    // browser or other
    root.MxWcMarkdown = factory(
      root.MxWcI18N,
      root.MxWcTool,
      root.MxWcDOMTool,
      root.MxWcLog,
      root.MxWcExtMsg,
      root.MxWcTask,
      root.MxWcMdPluginGist,
      root.MxWcMdPluginMisc,
      root.MxWcMdPluginMathjax,
      root.MxWcMdPluginMathML2LaTeX,
      root.MxWcCapturerA,
      root.MxWcCapturerImg,
      root.MxWcCapturerIframe,
    );
  }
})(this, function(I18N, T, DOMTool, Log, ExtMsg, Task,
    MdPluginGist,
    MdPluginMisc,
    MdPluginMathJax,
    MdPluginMathML2LaTeX,
    CapturerA,
    CapturerImg,
    CapturerIframe,
    undefined) {
  "use strict";

  // require turndownservice

  /*
   * @param {Object} params
   */
  async function parse(params){
    Log.debug("markdown parser");
    const {storageInfo, elem, info, config} = params;
    const [mimeTypeDict, frames] = await Promise.all([
      ExtMsg.sendToBackground({type: 'get.mimeTypeDict'}),
      ExtMsg.sendToBackground({type: 'get.allFrames'}),
      ExtMsg.sendToBackground({type: 'keyStore.init'})
    ]);

    //FIXME
    const headers = {
      "Referer"    : window.location.href,
      "Origin"     : window.location.origin,
      "User-Agent" : window.navigator.userAgent
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
    if(config.saveClippingInformation){
      markdown += generateMdClippingInfo(info);
    }
    const filename = T.joinPath(storageInfo.saveFolder, info.filename);
    const mainFileTask = Task.createMarkdownTask(filename, markdown, info.clipId);
    tasks.push(mainFileTask);
    return Task.appendHeaders(tasks, headers);
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
      config: config,
    } = params;
    Log.debug("getElemHtml", docUrl);


    const KLASS = 'mx-wc-selected-elem';
    elem.classList.add(KLASS);
    DOMTool.markHiddenNode(window, elem);
    const docHtml = document.documentElement.outerHTML;
    elem.classList.remove(KLASS);
    DOMTool.clearHiddenMark(elem);


    const {doc} = DOMTool.parseHTML(docHtml);
    let selectedNode = doc.querySelector('.' + KLASS);
    selectedNode = DOMTool.removeNodeByHiddenMark(selectedNode);

    const aNodes       = DOMTool.queryNodesByTagName(selectedNode, 'a');
    const imgNodes     = DOMTool.queryNodesByTagName(selectedNode, 'img');
    const iframeNodes  = DOMTool.queryNodesByTagName(selectedNode, 'iframe');

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
        nodes:iframeNodes,
        capturer: CapturerIframe,
        opts: {saveFormat, baseUrl, docUrl, storageInfo, clipId, mimeTypeDict, config, parentFrameId, frames}
      }
    ];

    const taskCollection = [];

    for (let i = 0; i < captureInfos.length; i++) {
      const it = captureInfos[i];
      for (let j = 0; j < it.nodes.length; j++) {
        const node = it.nodes[j];
        const tasks = await it.capturer.capture(node, it.opts);
        taskCollection.push(...tasks);
      }
    }


    selectedNode = MdPluginMisc.handle(doc, selectedNode);
    selectedNode = MdPluginGist.handle(doc, selectedNode);
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

  return {
    parse: parse,
    getElemHtml: getElemHtml
  }
});
