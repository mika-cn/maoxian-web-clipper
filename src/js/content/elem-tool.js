const ElemTool = {}

ElemTool.isBoxSizeEq = (elemA, elemB) => {
  if(elemA && elemB){
    const boxA = elemA.getBoundingClientRect();
    const boxB = elemB.getBoundingClientRect();
    return boxA.width === boxB.width && boxA.height === boxB.height;
  } else {
    return false;
  }
}

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
  const childToRemove = [];
  xpaths.forEach((xpath) => {
    const child = win.document.evaluate(
      xpath,
      elem,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue
    if(child){
      childToRemove.push(child);
    } else {
      console.error("Xpath elem not found", xpath);
    }
  });

  childToRemove.forEach((child) => {
    const pElem = child.parentElement;
    pElem.removeChild(child);
  })
  return elem;
}

ElemTool.isElemVisible = (win, elem) => {
  if(['IMG', 'PEATURE'].indexOf(elem.tagName) > -1) {
    return true
  }

  /*
  if(elem.offsetWidth === 0 && elem.offsetHeight === 0){
    return false
  }
  */

  const style = win.getComputedStyle(elem);
  if(style.display === 'none') {
    return false;
  }
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
  let assetInfos = [];
  T.each(assetTags, function(tag){
    const link = tag[attrName];
    if(T.isDataProtocol(link) || T.isHttpProtocol(link)){
      const assetName = ElemTool.getAssetName({
        clipId: clipId,
        link: link,
        extension: extension,
        mimeTypeDict: mimeTypeDict
      });
      assetInfos.push({
        tag: tag,
        link: link,
        assetName: assetName
      });
    }
  })
  return assetInfos;
}

/*
 * Some asset link haven't file extension.
 * This will cause browser don't know how to render them (when load from local).
 * try to fix it.
 */
ElemTool.getAssetName = function(params) {
  const {clipId, link, extension, mimeTypeDict={}} = params;
  const ext = ( extension ? extension : ElemTool.getLinkExtension(link, mimeTypeDict));
  return [clipId, T.calcAssetName(link, ext)].join('-');
}


/*
 * link: (protocols: http/https/data)
 */
ElemTool.getLinkExtension = (link, mimeTypeDict) => {
  let url = new URL(link);
  if(url.protocol === 'data:') {
    //data:url
    const mimeType = url.pathname.split(';')[0];
    return ElemTool.mimeTypeToExtension(mimeType);
  } else {
    // http OR https
    let ext = T.getUrlExtension(url.href)
    if(ext) {
      return ext;
    } else {
      const mimeType = mimeTypeDict[link];
      if(mimeType) {
        return ElemTool.mimeTypeToExtension(mimeType);
      } else {
        return '';
      }
    }
  }
}

/*
 * get file extension according to mime type.
 */
ElemTool.mimeTypeToExtension = function(mimeType) {
  //TODO add webp ? etc
  let ext = null;
  switch(mimeType){
    case 'text/css'      : ext = 'css'; break;
    case 'image/gif'     : ext = 'gif'; break;
    case 'image/png'     : ext = 'png'; break;
    case 'image/jpeg'    : ext = 'jpg'; break;
    case 'image/svg+xml' : ext = 'svg'; break;
    case 'image/x-icon'  : ext = 'ico'; break;
  }
  return ext;
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



