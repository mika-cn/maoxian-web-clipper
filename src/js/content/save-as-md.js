
// require turndownservice
"use strict";

this.MxWcMarkdown = (function() {

  /*
   * @param {Object} params
   */
  function save(params){
    Log.debug("save markdown");
    const {fold, elem, info, config} = params;
    Promise.all([
      ExtApi.sendMessageToBackground({type: 'get.mimeTypeDict'}),
      ExtApi.sendMessageToBackground({type: 'get.allFrames'})
    ]).then((values) => {
      const [mimeTypeDict, frames] = values;
      Log.debug(frames);
      getElemHtml({
        win: window,
        frames: frames,
        fold: fold,
        elem: elem,
        refUrl: window.location.href,
        mimeTypeDict: mimeTypeDict
      }, function(html) {
        let markdown = generateMarkDown(html, info);
        if(config.saveClippingInformation){
          markdown += generateMdClippingInfo(info);
        }
        LocalDisk.saveTextFile(markdown, 'text/markdown', `${fold}/${info.filename}`);
      });
    });
  }

  function getElemHtml(params, callback){
    const topFrameId = 0;
    const {
      win,
      frames,
      fold,
      elem,
      refUrl,
      mimeTypeDict,
      parentFrameId = topFrameId
    } = params;
    Log.debug("getElemHtml", refUrl);
    let clonedElem = ElemTool.cloneAndCompleteLink(elem, refUrl);

    const imgTags = T.getTagsByName(clonedElem, 'img')
    const imgAssetInfos = ElemTool.getAssetInfos(imgTags, 'src', mimeTypeDict);
    const assetFold = fold + '/assets';
    LocalDisk.saveImageFiles(assetFold, imgAssetInfos, T.getDoOnceObj())

    // collect current layer frames
    const frameElems = [];
    const promises = [];
    T.each(frames, (frame) => {
      console.log(parentFrameId, frame.parentFrameId);
      if(parentFrameId === frame.parentFrameId) {
        const selector = `iframe[src="${frame.url}"]`;
        const frameElem = clonedElem.querySelector(selector);
        if(frameElem){
          frameElems.push(frameElem);
          promises.push(
            ExtApi.sendMessageToBackground({
              type: 'frame.toMd',
              to: frame.url,
              frameId: frame.frameId,
              body: {
                frames: frames,
                fold: fold,
                mimeTypeDict: mimeTypeDict
              }
           })
          );
        }
      }
    });

    const complete = function() {
      // rewrite links
      clonedElem = ElemTool.rewriteAnchorLink(clonedElem, refUrl);
      let elemHtml = clonedElem.outerHTML;
      elemHtml = ElemTool.rewriteImgLink(elemHtml, imgAssetInfos);
      Log.debug("Finish: ", refUrl);
      callback(elemHtml);
    }

    Log.debug("iframe length: ", promises.length);
    if(promises.length > 0){
      Promise.all(promises)
        .then((frameHtmls) => {
          T.each(frameHtmls, (frameHtml, idx) => {
            Log.debug(idx);
            // Replace frame element use frame html.
            const frameElem = frameElems[idx];
            const pNode = frameElem.parentNode;
            const newNode = win.document.createElement("div");
            newNode.innerHTML = frameHtml;
            pNode.insertBefore(newNode, frameElem);
            pNode.removeChild(frameElem);
            Log.debug("frameElem removed");
          });
          complete();
        })
    } else {
      Log.debug("len: ", 0);
      complete();
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
    md += `\n\n${t('category')}: ${info.category}`;
    let tagstr = t('none');
    if(info.tags.length > 0){
      tagstr = T.map(info.tags, function(tag){
        return "`" + tag + "`";
      }).join(", ");
    }
    md += `\n\n${t('tags')}: ${tagstr}`;
    md += "\n\n";
    return md
  }

  function getTurndownService(){
    const service = new TurndownService({codeBlockStyle: 'fenced'});
    service.addRule('ignoreTag', {
      filter: ['style', 'script', 'noscript', 'noframes', 'canvas', 'template'],
      replacement: function(content, node, options){return ''}
    })
    return service;
  }

  return {
    save: save,
    getElemHtml: getElemHtml
  }

})();
