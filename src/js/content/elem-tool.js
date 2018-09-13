const ElemTool = {}

ElemTool.getHiddenElementXpaths = (win, elem, xpaths=[], prefix="") => {
  T.each(elem.children, (childElem, index) => {
    const xpath = [prefix, '*[', index + 1, ']'].join('');
    if(ElemTool.isElemVisible(win, childElem)) {
      xpaths = ElemTool.getHiddenElementXpaths(
        win, childElem, xpaths, xpath + '/');
    } else {
      xpaths.push(xpath);
    }
  })
  return xpaths;
}

ElemTool.removeChildByXpath = (win, elem, xpaths) => {
  xpaths.forEach((xpath) => {
    const child = win.document.evaluate(
      xpath,
      elem,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue
    if(child){
      const pElem = child.parentElement;
      pElem.removeChild(child);
    } else {
      console.warn("Xpath elem not found", xpath);
    }
  });
  return elem;
}

ElemTool.isElemVisible = (win, elem) => {
  if(elem.offsetWidth === 0 && elem.offsetHeight === 0){
    return false
  }
  const style = win.getComputedStyle(elem);
  if(style.visibility === 'hidden'){
    return false
  }
  return true
}

// params: {
//   extension, => optional
// }
// return [{:tag, :link, :assetName}]
ElemTool.getAssetInfos = (params ) => {
  const { clipId, assetTags, attrName, mimeTypeDict, extension} = params;
  let arr = [];
  T.each(assetTags, function(tag){
    const link = tag[attrName];
    if(T.isHttpProtocol(link)){
      const fixedLink = ElemTool.fixLinkExtension(link, mimeTypeDict);
      const assetName = [clipId, T.calcAssetName(fixedLink, extension)].join('-');
      const assetInfo = {
        tag: tag,
        link: link,
        assetName: assetName
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
ElemTool.rewriteImgLink = (html, assetRelativePath, assetInfos) => {
  T.each(assetInfos, function(it){
    const tagHtml = it.tag.outerHTML;
    const link = it.tag.getAttribute('src');
    it.tag.removeAttribute('crossorigin');
    let newHtml = it.tag.outerHTML;
    newHtml = newHtml.replace(link, [assetRelativePath, it.assetName].join('/'));
    newHtml = newHtml.replace(link.replace(/&/g, '&amp;'), [assetRelativePath, it.assetName].join('/'));
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



