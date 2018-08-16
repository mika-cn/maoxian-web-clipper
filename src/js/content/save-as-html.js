
// save html (include image);

function saveAsHtml(fold, elem, info){
  Log.debug("save html");

  let clonedElem = ElemTool.cloneAndCompleteLink(elem);
  ExtApi.sendMessageToBackground({type: 'get.mimeTypeDict'}).then((mimeTypeDict) => {
    const result = parseAssetInfo(clonedElem, mimeTypeDict);
    const doOnce = T.getDoOnceObj();
    const assetFold = fold + '/assets';


    // deal internal style
    result.internalStyles = T.map(result.styleTexts, (styleText) => {
      return parseCss(assetFold, styleText, info.link, doOnce, mimeTypeDict);
    });

    const html = generateHtml(elem, clonedElem, info, result);
    LocalDisk.saveTextFile( html, 'text/html', `${fold}/${info.filename}`);

    // deal external style
    downloadCssFiles(assetFold, result.cssAssetInfos, doOnce, mimeTypeDict);

    // download assets
    LocalDisk.saveImageFiles(assetFold, result.imgAssetInfos, T.getDoOnceObj());
  });
}

/*
 * assetInfo: {:tag, :link, :assetName}
 */
function parseAssetInfo(clonedElem, mimeTypeDict){
  const listA = T.getTagsByName(clonedElem, 'img');
  const listB = T.getTagsByName(document, 'style');
  const listC = document.querySelectorAll("link[rel=stylesheet]");

  return {
    imgAssetInfos: ElemTool.getAssetInfos( listA, 'src', mimeTypeDict),
    cssAssetInfos: ElemTool.getAssetInfos( listC, 'href', mimeTypeDict),
    styleTexts: T.map(listB, (tag) => { return tag.innerHTML })
  }
}

function downloadCssFiles(fold, assetInfos, doOnce, mimeTypeDict){
  T.each(assetInfos, function(it){
    doOnce.restrict(it.link, function(){
      fetch(it.link).then(function(resp){
        return resp.text();
      }).then(function(txt){
        cssText = parseCss(fold, txt, it.link, doOnce, mimeTypeDict);
        LocalDisk.saveTextFile(cssText, 'text/css', `${fold}/${it.assetName}`);
      });
    });
  });
}


function parseCss(fold, styleText, refUrl, doOnce, mimeTypeDict){
  // FIXME danger here
  const rule1 = {regExp: /url\("[^\)]+"\)/gm, template: 'url("$PATH")', separator: '"'};
  const rule2 = {regExp: /url\('[^\)]+'\)/gm, template: 'url("$PATH")', separator: "'"};
  const rule3 = {regExp: /url\([^\)'"]+\)/gm, template: 'url("$PATH")', separator: /\(|\)/ };

  const rule11 = {regExp: /@import\s+url\("[^\)]+"\)/igm, template: '@import url("$PATH")', separator: '"'};
  const rule12 = {regExp: /@import\s+url\('[^\)]+'\)/igm, template: '@import url("$PATH")', separator: "'"};
  const rule13 = {regExp: /@import\s+url\([^\)'"]+\)/igm, template: '@import url("$PATH")', separator: /\(|\)/ };

  const rule14 = {regExp: /@import\s*'[^;']+'/igm, template: '@import url("$PATH")', separator: "'"};
  const rule15 = {regExp: /@import\s*"[^;"]+"/igm, template: '@import url("$PATH")', separator: '"'};


  styleText = stripCssComments(styleText);

  // fonts
  const fontRegExp = /@font-face\s?\{[^\}]+\}/gm;
  styleText = styleText.replace(fontRegExp, function(match){
    const r = parseCssTextUrl(match, refUrl, [rule1, rule2, rule3], mimeTypeDict);
    LocalDisk.saveFontFiles(fold, r.assetInfos, doOnce, mimeTypeDict);
    return r.cssText;
  });

  // @import css
  const cssRegExp = /@import[^;]+;/igm;
  styleText = styleText.replace(cssRegExp, function(match){
    const r = parseCssTextUrl(match, refUrl, [rule11, rule12, rule13, rule14, rule15], mimeTypeDict);
    downloadCssFiles(fold, r.assetInfos, doOnce);
    return r.cssText;
  });

  return styleText;
}

function parseCssTextUrl(cssText, refUrl, rules, mimeTypeDict){
  let assetInfos = [];
  const getReplace = function(rule){
    return function(match){
      const part = match.split(rule.separator)[1].trim();
      if(T.isHttpProtocol(part)){
        const fullUrl = T.prefixUrl(part, refUrl);
        const fixedLink = ElemTool.fixLinkExtension(fullUrl, mimeTypeDict);
        const assetName = T.calcAssetName(fixedLink);
        assetInfos.push({link: fullUrl, assetName: assetName});
        if(T.isUrlSameLevel(refUrl, window.location.href)){
          return rule.template.replace('$PATH', `assets/${assetName}`);
        }else{
          return rule.template.replace('$PATH', assetName);
        }
      }else{
        return match;
      }
    }
  }
  T.each(rules, function(rule){
    cssText = cssText.replace(rule.regExp, getReplace(rule));
  });
  return { cssText: cssText, assetInfos: assetInfos };
}

// calculate selected elem backgroundColor
// TODO check other browser represent background as 'rgb(x,x,x,)' format
function getBgCss(elem){
  if(!elem){
    return "rgb(255, 255, 255)";
  }//  default white;
  const bgCss = window.getComputedStyle(elem, null).getPropertyValue('background-color');
  if(bgCss == "rgba(0, 0, 0, 0)"){ // transparent
    return getBgCss(elem.parentElement);
  }else{
    return bgCss;
  }
}

function generateHtml(elem, clonedElem, info, parseResult){
  let bodyBgCss = getBgCss(document.body);
  const bodyId = document.body.id;
  const bodyClass = document.body.className;
  const elemWrappers = getWrappers(elem, []);
  const outerElem = elemWrappers.length > 0 ? elemWrappers[elemWrappers.length - 1] : elem
  const outerElemBgCss = getBgCss(outerElem);
  const elemBgCss = getBgCss(elem);
  if(elemBgCss == outerElemBgCss){
    if(outerElemBgCss == 'rgb(255, 255, 255)'){
      bodyBgCss = '#464646';
    }else{
      //TODO use opposite color
      bodyBgCss = '#ffffff';
    }
  }else{
    if(elemBgCss == bodyBgCss || outerElemBgCss == bodyBgCss){
      bodyBgCss = '#464646';
    }

  }

  const elemWidth = getFitWidth(elem)

  const styleHtml = getCssLinkTagsHtml(parseResult.cssAssetInfos) + getInternalStyleHtml(parseResult.internalStyles)

  clonedElem.classList.add("mx-wc-selected-elem");
  clonedElem.style = (clonedElem.style.cssText || "") + "float: none; position: relative; top: 0; left: 0; margin: 0px; flex:unset; width: 100%; max-width: 100%; box-sizing: border-box;";
  clonedElem = ElemTool.rewriteAnchorLink(clonedElem, info.link);
  let elemHtml = clonedElem.outerHTML;
  elemHtml = ElemTool.rewriteImgLink(elemHtml, parseResult.imgAssetInfos)
  T.each(['style', 'script', 'noscript', 'template'], function(tagName){
    elemHtml = removeTagHtml(elemHtml, elem, tagName);
  });
  elemHtml = wrapToBody(elem, elemHtml);
  const html = MxWcTemplate.outputHtml.render({
    info: info,
    styleHtml: styleHtml,
    elemHtml: elemHtml,
    outerElemBgCss: outerElemBgCss,
    elemWidth: elemWidth,
    bodyBgCss: bodyBgCss,
    bodyId: bodyId,
    bodyClass: bodyClass,
  })
  return html
}

/* wrap to body element */
function wrapToBody(elem, html){
  let pElem = elem.parentElement;
  while(pElem && ['html', 'body'].indexOf(pElem.tagName.toLowerCase()) == -1){
    const tagName = pElem.tagName
    let attrs = []
    /* make sure highest priority */
    let style = "display: block; float: none; position: relative; top: 0; left: 0; border: 0px; width: 100%; min-width:100%; max-width: 100%; min-height: auto; max-height: 100%; height: auto; padding: 0px; margin: 0px;"
    T.each(pElem.attributes, function(attr){
      if(attr.name == "style"){
        style = (attr.value || "") + style;
      }else{
        attrs.push([attr.name, attr.value]);
      }
    });
    attrs.push(['style', style]);
    const attrHtml = T.map(attrs, function(pair){
      return `${pair[0]}="${pair[1]}"`;
    }).join(' ');
    html = `<${tagName} ${attrHtml}>${html}</${tagName}>`;
    pElem = pElem.parentElement;
  }
  return html;
}


function getWrappers(elem, wrapperList){
  const pElem = elem.parentElement;
  if(pElem && ['HTML', 'BODY'].indexOf(pElem.tagName) == -1){
    if(pElemHasNearWidth(pElem, elem) || siblingHasSameStructure(elem)){
      // probably is a wrapper
      wrapperList.push(pElem);
      return getWrappers(pElem, wrapperList);
    }else{
      return wrapperList;
    }
  }else{
    return wrapperList;
  }
}

// maybe need to compare all sibling?
function siblingHasSameStructure(elem){
  const prevSibling = elem.previousElementSibling;
  const nextSibling = elem.nextElementSibling;
  if(prevSibling && hasSameStructure(prevSibling, elem)){
    return true;
  }
  if(nextSibling && hasSameStructure(nextSibling, elem)){
    return true;
  }
  return false;
}

function hasSameStructure(elemA, elemB){
  if(elemA.tagName != elemB.tagName){ return false }
  const listA = T.unique(elemA.classList);
  const listB = T.unique(elemB.classList);
  const list = T.intersection(listA, listB)
  return list.length === Math.min(listA.length, listB.length);
}

function pElemHasNearWidth(pElem, elem){
  const threshold = 10; //10px
  const box = elem.getBoundingClientRect();
  const pBox = pElem.getBoundingClientRect();
  return pBox.width - 2 * getElemPaddingLeft(pElem) - box.width < threshold
}

function getElemPaddingLeft(elem){
  return getCssSize(elem, 'padding-left')
}

function getFitWidth(elem){
  const width = elem.getBoundingClientRect().width;
  const widthText = getStyleText(elem, 'width')
  if(widthText.match(/\d+px/)){
    // absolate width
    return width;
  }else{
    // percentage or not set.
    if(width > 980){ return width }
    if(width > 900){ return 980 }
    if(width > 800){ return 900 }
    if(width > 700){ return 800 }
    if(width > 600){ return 700 }
    return 600;
  }
}

// get original style text. e.g. '100px' , '50%'
// See: https://stackoverflow.com/questions/30250918/how-to-know-if-a-div-width-is-set-in-percentage-or-pixel-using-jquery#30251040
function getStyleText(elem, cssKey){
  const style = window.getComputedStyle(elem, null);
  const display = style.getPropertyValue("display");
  elem.style.display = "none";
  const value = style.getPropertyValue(cssKey);
  elem.style.display = display;
  return value;
}

function getCssSize(elem, cssKey){
  const style = window.getComputedStyle(elem, null);
  let size = style.getPropertyValue(cssKey);
  size.replace('px', '');
  if(size === ''){
    return 0;
  }else{
    return parseInt(size);
  }
}


// external(css file)
function getCssLinkTagsHtml(assetInfos){
  let html = "";
  T.each(assetInfos, function(it){
    const tag = it.tag.cloneNode(true);
    tag.removeAttribute('crossorigin');
    tag.removeAttribute('integrity');
    let part = tag.outerHTML;
    const href = tag.getAttribute('href');
    part = part.replace(href, 'assets/' + it.assetName);
    part = part.replace(href.replace(/&/g, '&amp;'), 'assets/' + it.assetName);

    html += "\n";
    html += part;
    html += "\n";
  })
  return html;
}

// internal(<style> tag)
function getInternalStyleHtml(styles){
  let html = "";
  T.each( styles, function(style){
    html += "<style>\n";
    html += style
    html += "\n</style>\n";
  });
  return html;
}

function removeTagHtml(html, elem, tagName){
  T.each(elem.getElementsByTagName(tagName), function(tag){
    html = html.replace(tag.outerHTML, '');
  })
  return html;
}
