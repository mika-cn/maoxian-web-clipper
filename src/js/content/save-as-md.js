
// require turndownservice
"use strict";

this.MxWcMarkdown = (function() {

  /*
   * @param {Object} params
   */
  async function parse(params){
    Log.debug("markdown parser");
    const {path, elem, info, config} = params;
    const [mimeTypeDict, frames] = await Promise.all([
      ExtApi.sendMessageToBackground({type: 'get.mimeTypeDict'}),
      ExtApi.sendMessageToBackground({type: 'get.allFrames'}),
      KeyStore.init()
    ]);
    const {html, tasks} = await getElemHtml({
      clipId: info.clipId,
      win: window,
      frames: frames,
      path: path,
      elem: elem,
      refUrl: window.location.href,
      mimeTypeDict: mimeTypeDict
    })
    let markdown = generateMarkDown(html, info);
    markdown = PluginMathJax.unEscapeMathJax(markdown);
    markdown = PluginMathML2LaTeX.unEscapeLaTex(markdown);
    if(config.saveClippingInformation){
      markdown += generateMdClippingInfo(info);
    }
    const filename = T.joinPath([path.clipFold, info.filename]);
    const markdownTask = {
      taskType: 'markdownFileTask',
      type: 'text',
      filename: filename,
      mimeType: 'text/markdown',
      text: markdown,
      clipId: info.clipId,
      createdMs: T.currentTime().str.intMs
    }
    console.log(markdown);
    tasks.push(markdownTask);
    return tasks;
  }

  async function getElemHtml(params){
    const topFrameId = 0;
    const {
      clipId,
      win,
      frames,
      path,
      elem,
      refUrl,
      mimeTypeDict,
      parentFrameId = topFrameId
    } = params;
    Log.debug("getElemHtml", refUrl);
    const xpaths = ElemTool.getHiddenElementXpaths(win, elem);
    let clonedElem = elem.cloneNode(true);
    clonedElem = ElemTool.removeChildByXpath(win, clonedElem, xpaths);
    clonedElem = T.completeElemLink(clonedElem, refUrl);

    const imgTags = T.getTagsByName(clonedElem, 'img')
    const imgAssetInfos = ElemTool.getAssetInfos({
      type: 'imageFile',
      clipId: clipId,
      assetTags: imgTags,
      attrName: 'src',
      mimeTypeDict: mimeTypeDict
    });

    // FIXME remove me
    //StoreClient.addImages(clipId, path.assetFold, imgAssetInfos);

    let [newClonedElem, frameTasks] = await handleFrames(params, clonedElem);
    clonedElem = newClonedElem;

    Log.debug("FrameHandlefihish");
    clonedElem = ElemTool.rewriteAnchorLink(clonedElem, refUrl);
    clonedElem = PluginMisc.handle(win, clonedElem);
    clonedElem = PluginGist.handle(win, clonedElem);
    clonedElem = PluginMathJax.handle(win, clonedElem);
    clonedElem = PluginMathML2LaTeX.handle(win, clonedElem);
    let html = clonedElem.outerHTML;
    html = ElemTool.rewriteImgLink(html, path.assetRelativePath, imgAssetInfos);
    const imgTasks = StoreClient.assetInfos2Tasks(clipId, path.assetFold, imgAssetInfos);
    return {html: html, tasks: imgTasks.concat(frameTasks)};
  }

  async function handleFrames(params, clonedElem) {
    const topFrameId = 0;
    const {clipId, win, frames, path, mimeTypeDict,
      parentFrameId = topFrameId} = params;
    // collect current layer frames
    const frameElems = [];
    const promises = [];
    T.each(frames, (frame) => {
      console.log(parentFrameId, frame.parentFrameId);
      if(parentFrameId === frame.parentFrameId && !T.isExtensionUrl(frame.url)) {
        const frameElem = ElemTool.getFrameBySrc(clonedElem, frame.url)
        if(frameElem){
          frameElems.push(frameElem);
          promises.push(
            ExtApi.sendMessageToBackground({
              type: 'frame.toMd',
              to: frame.url,
              frameId: frame.frameId,
              body: {
                clipId: clipId,
                frames: frames,
                path: path,
                mimeTypeDict: mimeTypeDict
              }
           })
          );
        }
      }
    });

    Log.debug("iframe length: ", promises.length);
    if(promises.length > 0){
      const results = await Promise.all(promises)
      let container = clonedElem;
      let allTasks = [];
      T.each(results, (result, idx) => {
        // Replace frame element use frame html.
        // FIXME
        // If a frame got images, this replacement will trigger some image requests immediately. those request will end with 404 errors, cause we haven't save those image yet.
        console.log(result);
        const {html, tasks} = result;
        allTasks = allTasks.concat(tasks);
        const frameElem = frameElems[idx];
        const newNode = win.document.createElement("div");
        newNode.innerHTML = (html || '');
        if(container === frameElem) {
          container = newNode;
        } else {
          const pNode = frameElem.parentNode;
          pNode.insertBefore(newNode, frameElem);
          pNode.removeChild(frameElem);
        }
      });
      return [container, allTasks];
    } else {
      return [clonedElem, []];
    }
  }



  function generateMarkDown(elemHtml, info){
    Log.debug('generateMarkDown');
    const turndownService = getTurndownService();
    let md = "";
    md += `# [${info.title}]\n\n`;
    md += turndownService.turndown(elemHtml);
    return md;
  }

  function generateMdClippingInfo(info) {
    Log.debug('generateMdClippingInfo');
    let md = ""
    md += "\n\n---------------------------------------------------\n"
    md += `\n\n${t('original_url')}: [${t('access')}](${info.link})`;
    md += `\n\n${t('created_at')}: ${info.created_at}`;
    let categoryStr = t('none');
    let tagStr = t('none');
    if(info.category){
      categoryStr = info.category
    }
    if(info.tags.length > 0){
      tagStr = T.map(info.tags, function(tag){
        return "`" + tag + "`";
      }).join(", ");
    }
    md += `\n\n${t('category')}: ${categoryStr}`;
    md += `\n\n${t('tags')}: ${tagStr}`;
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

})();
