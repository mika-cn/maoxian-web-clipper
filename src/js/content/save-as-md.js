// require turndownservice
//
// @{elem} Element - dom element to clip
// @{info} Object - {:title, :link, :tags}
function saveAsMd(fold, elem, info){
  Log.debug("save markdown");

  clonedElem = ElemTool.cloneAndCompleteLink(elem);
  ExtApi.sendMessageToBackground({type: 'get.mimeTypeDict'}).then((mimeTypeDict) => {
    const imgTags = T.getTagsByName(clonedElem, 'img')
    const imgAssetInfos = ElemTool.getAssetInfos(imgTags, 'src', mimeTypeDict);
    const assetFold = fold + '/assets';
    LocalDisk.saveImageFiles(assetFold, imgAssetInfos, T.getDoOnceObj())

    const markdown = generateMarkDown(clonedElem, info, imgAssetInfos);
    LocalDisk.saveTextFile(markdown, 'text/markdown', `${fold}/${info.filename}`);
  });
}

function generateMarkDown(clonedElem, info, imgAssetInfos){
  clonedElem = ElemTool.rewriteAnchorLink(clonedElem, info.link);
  let elemHtml = clonedElem.outerHTML;
  elemHtml = ElemTool.rewriteImgLink(elemHtml, imgAssetInfos)
  const turndownService = getTurndownService();
  let md = ""
  md += `# [${info.title}]\n\n`;
  md += turndownService.turndown(elemHtml);
  md += generateMdClippingInfo(info);
  return md;
}

function generateMdClippingInfo(info) {
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
