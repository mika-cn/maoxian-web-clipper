
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
      ExtMsg.sendToBackground({type: 'get.mimeTypeDict'}),
      ExtMsg.sendToBackground({type: 'get.allFrames'}),
      KeyStore.init()
    ]);
    const {html, tasks} = await getElemHtml({
      clipId: info.clipId,
      frames: frames,
      path: path,
      elem: elem,
      refUrl: window.location.href,
      mimeTypeDict: mimeTypeDict,
      config: config,
    })
    let markdown = generateMarkDown(html, info);
    markdown = PluginMathJax.unEscapeMathJax(markdown);
    markdown = PluginMathML2LaTeX.unEscapeLaTex(markdown);
    if(config.saveClippingInformation){
      markdown += generateMdClippingInfo(info);
    }
    const filename = T.joinPath([path.saveFolder, info.filename]);
    const mainFileTask = {
      taskType: 'mainFileTask',
      type: 'text',
      filename: filename,
      mimeType: 'text/markdown',
      text: markdown,
      clipId: info.clipId,
      createdMs: T.currentTime().str.intMs
    }
    tasks.push(mainFileTask);
    return tasks;
  }

  async function getElemHtml(params){
    const topFrameId = 0;
    const {
      clipId,
      frames,
      path,
      elem,
      refUrl,
      mimeTypeDict,
      parentFrameId = topFrameId,
      config: config,
    } = params;
    Log.debug("getElemHtml", refUrl);
    const xpaths = ElemTool.getHiddenElementXpaths(window, elem);
    let clonedElem = elem.cloneNode(true);
    clonedElem = ElemTool.removeChildByXpath(window, clonedElem, xpaths);
    clonedElem = T.completeElemLink(clonedElem, refUrl);

    const imgTags = T.getTagsByName(clonedElem, 'img')
    const imgAssetInfos = ElemTool.getAssetInfos({
      type: 'imageFile',
      clipId: clipId,
      assetTags: imgTags,
      attrName: 'src',
      mimeTypeDict: mimeTypeDict
    });

    let [newClonedElem, frameTasks] = await handleFrames(params, clonedElem);
    clonedElem = newClonedElem;

    Log.debug("FrameHandlefihish");
    clonedElem = ElemTool.rewriteAnchorLink(clonedElem, refUrl);
    clonedElem = PluginMisc.handle(window, clonedElem);
    clonedElem = PluginGist.handle(window, clonedElem);
    clonedElem = PluginMathJax.handle(window, clonedElem);
    clonedElem = PluginMathML2LaTeX.handle(window, clonedElem);
    let html = clonedElem.outerHTML;
    html = ElemTool.rewriteImgLink(html, path.assetRelativePath, imgAssetInfos);
    const imgTasks = StoreClient.assetInfos2Tasks(clipId, path.assetFolder, imgAssetInfos);
    return {html: html, tasks: imgTasks.concat(frameTasks)};
  }

  async function handleFrames(params, clonedElem) {
    const topFrameId = 0;
    const {clipId, frames, path, mimeTypeDict,
      parentFrameId = topFrameId, config} = params;
    // collect current layer frames
    const frameElems = [];
    const promises = [];
    for(let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      Log.debug(parentFrameId, frame.parentFrameId, frame.url);
      if(parentFrameId === frame.parentFrameId && !T.isExtensionUrl(frame.url)) {
        const frameElem = ElemTool.getFrameBySrc(clonedElem, frame.url)
        if(frameElem){
          const canAdd = await KeyStore.add(frame.url);
          if(canAdd) {
            frameElems.push(frameElem);
            promises.push(
              ExtMsg.sendToBackground({
                type: 'frame.toMd',
                frameId: frame.frameId,
                frameUrl: frame.url,
                body: {
                  clipId: clipId,
                  frames: frames,
                  path: path,
                  mimeTypeDict: mimeTypeDict,
                  config: config,
                }
             })
            );
          }
        }
      }
    };

    Log.debug("iframe length: ", promises.length);
    if(promises.length == 0){
      return [clonedElem, []];
    } else {
      const results = await Promise.all(promises)
      let container = clonedElem;
      const taskCollection = [];
      T.each(results, (result, idx) => {
        if(result) {
          // Replace frame element use frame html.
          // FIXME
          // If a frame have images, this replacement will trigger some image requests immediately. those request will end with 404 errors, cause we haven't save those image yet.
          const {html, tasks} = result;
          taskCollection.push(...tasks);
          const frameElem = frameElems[idx];
          const newNode = document.createElement("div");
          T.setHtml(newNode, (html || ''));
          if(container === frameElem) {
            container = newNode;
          } else {
            const pNode = frameElem.parentNode;
            pNode.insertBefore(newNode, frameElem);
            pNode.removeChild(frameElem);
          }
        } else {
          // Do nothing.
          // Frame page failed to load.
          // result is undefind, return by promise.catch
        }
      });
      return [container, taskCollection];
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
    md += `\n\n${t('original-url')}: [${t('access')}](${info.link})`;
    md += `\n\n${t('created-at')}: ${info.created_at}`;
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
