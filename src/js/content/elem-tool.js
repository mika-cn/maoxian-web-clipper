const ElemTool = {}
ElemTool.cloneAndCompleteLink = (elem, refUrl) => {
  let clonedElem = elem.cloneNode(true); // true => deep clone
  return T.completeElemLink(clonedElem, refUrl);
}

// return [{:tag, :link, :assetName}]
ElemTool.getAssetInfos = (assetTags, attrName, mimeTypeDict, extension) => {
  let arr = [];
  T.each(assetTags, function(tag){
    const link = tag[attrName];
    if(T.isHttpProtocol(link)){
      const fixedLink = ElemTool.fixLinkExtension(link, mimeTypeDict);
      const assetInfo = {
        tag: tag,
        link: link,
        assetName: T.calcAssetName(fixedLink, extension),
      }
      arr.push(assetInfo);
    }
  })
  return arr;
}

/*
 * Some asset link haven't file extension.
 * This will cause browser don't know how to render them (when load from local).
 */
ElemTool.fixLinkExtension = (link, mimeTypeDict) => {
  let url = new URL(link);
  if(url.pathname.indexOf('.') > -1){
    return link;
  }else{
    const mimeType = mimeTypeDict[link];
    if(mimeType){
      let ext = null;
      //TODO add webp ? etc
      switch(mimeType){
        case 'text/css'      : ext = 'css'; break;
        case 'image/gif'     : ext = 'gif'; break;
        case 'image/png'     : ext = 'png'; break;
        case 'image/jpeg'    : ext = 'jpg'; break;
        case 'image/svg+xml' : ext = 'svg'; break;
        case 'image/x-icon'  : ext = 'ico'; break;
      }
      if(ext){
        url.pathname = `${url.pathname}.${ext}`
        return url.href;
      }else{
        return link;
      }
    }else{
      return link;
    }
  }
}


// rewrite link to local path.
ElemTool.rewriteImgLink = (html, assetInfos) => {
  T.each(assetInfos, function(it){
    const tagHtml = it.tag.outerHTML;
    const link = it.tag.getAttribute('src');
    it.tag.removeAttribute('crossorigin');
    let newHtml = it.tag.outerHTML;
    newHtml = newHtml.replace(link, 'assets/' + it.assetName);
    newHtml = newHtml.replace(link.replace(/&/g, '&amp;'), 'assets/' + it.assetName);
    html = html.replace(tagHtml, newHtml);
  });
  return html;
}

// http://example.org/a/b#anchor => #anchor
ElemTool.rewriteAnchorLink = (elem, siteLink) => {
  const siteUrl = new URL(siteLink);
  T.each(T.getTagsByName(elem, 'a'), function(tag){
    if(T.isHttpProtocol(tag.href)){
      const url = new URL(tag.href);
      const isAnchorLink = (
        siteUrl.origin == url.origin
        && siteUrl.pathname == url.pathname
        && siteUrl.search == url.search
        && url.hash != ''
      );
      if(isAnchorLink){
        tag.href = url.hash;
      }
    }
  });
  return elem;
}



