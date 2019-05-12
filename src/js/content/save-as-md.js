
// require turndownservice
"use strict";

this.MxWcMarkdown = (function() {

  /*
   * @param {Object} params
   */
  function parse(params){
    Log.debug("markdown parser");
    const {path, elem, info, config} = params;
    Promise.all([
      ExtApi.sendMessageToBackground({type: 'get.mimeTypeDict'}),
      ExtApi.sendMessageToBackground({type: 'get.allFrames'}),
      KeyStore.init()
    ]).then((values) => {
      const [mimeTypeDict, frames] = values;
      getElemHtml({
        clipId: info.clipId,
        win: window,
        frames: frames,
        path: path,
        elem: elem,
        refUrl: window.location.href,
        mimeTypeDict: mimeTypeDict
      }, function(html) {
        let markdown = generateMarkDown(html, info);
        markdown = PluginMathJax.unEscapeMathJax(markdown);
        markdown = PluginMathML2LaTeX.unEscapeLaTex(markdown);
        if(config.saveClippingInformation){
          markdown += generateMdClippingInfo(info);
        }
        TaskStore.save({
          clipId: info.clipId,
          type: 'text',
          mimeType: 'text/markdown',
          filename: T.joinPath([path.clipFold, info.filename]),
          text: markdown
        });
      });
    });
  }

  function getElemHtml(params, callback){
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
      clipId: clipId,
      assetTags: imgTags,
      attrName: 'src',
      mimeTypeDict: mimeTypeDict
    });
    StoreClient.addImages(clipId, path.assetFold, imgAssetInfos);

    handleFrames(params, clonedElem).then((clonedElem) => {
      Log.debug("FrameHandlefihish");
      clonedElem = ElemTool.rewriteAnchorLink(clonedElem, refUrl);
      clonedElem = PluginMisc.handle(win, clonedElem);
      clonedElem = PluginGist.handle(win, clonedElem);
      clonedElem = PluginMathJax.handle(win, clonedElem);
      clonedElem = PluginMathML2LaTeX.handle(win, clonedElem);
      let html = clonedElem.outerHTML;
      html = ElemTool.rewriteImgLink(html, path.assetRelativePath, imgAssetInfos);
      callback(html);
    });
  }

  function handleFrames(params, clonedElem) {
    const topFrameId = 0;
    const {clipId, win, frames, path, mimeTypeDict,
      parentFrameId = topFrameId} = params;
    return new Promise(function(resolve, _){
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
        Promise.all(promises)
          .then((frameHtmls) => {
            let container = clonedElem;
            T.each(frameHtmls, (frameHtml, idx) => {
              // Replace frame element use frame html.
              const frameElem = frameElems[idx];
              const newNode = win.document.createElement("div");
              newNode.innerHTML = (frameHtml || '');
              if(container === frameElem) {
                container = newNode;
              } else {
                const pNode = frameElem.parentNode;
                pNode.insertBefore(newNode, frameElem);
                pNode.removeChild(frameElem);
              }
            });
            resolve(container);
          })
      } else {
        resolve(clonedElem);
      }
    });
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
