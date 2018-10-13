
"use strict";

this.MxWcHtml = (function () {
  /*
   * @param {Object} params
   */
  function parse(params){
    Log.debug("html parser");
    const {path, elem, info, config} = params;

    Promise.all([
      ExtApi.sendMessageToBackground({type: 'get.mimeTypeDict'}),
      ExtApi.sendMessageToBackground({type: 'get.allFrames'}),
      KeyStore.init()
    ]).then((values) => {
      const [mimeTypeDict, frames] = values;
      // 获取选中元素的html
      getElemHtml({
        clipId: info.clipId,
        win: window,
        frames: frames,
        path: path,
        elem: elem,
        refUrl: window.location.href,
        mimeTypeDict: mimeTypeDict,
        fetchAssetFirst: config.fetchAssetFirst,
        saveWebFont: config.saveWebFont
      }, function(htmls) {
        const {styleHtml, elemHtml} = htmls;
        // 将elemHtml 渲染进模板里，渲染成完整网页。
        const v = getElemRenderParams(elem);
        const page = (elem.tagName === 'BODY' ? 'bodyPage' : 'elemPage');
        v.info = info;
        v.styleHtml = styleHtml;
        v.elemHtml = elemHtml;
        v.config = config;
        const html = MxWcTemplate[page].render(v);
        TaskStore.save({
          clipId: info.clipId,
          type: 'text',
          mimeType: 'text/html',
          filename: T.joinPath([path.clipFold, info.filename]),
          text: html
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
      parentFrameId = topFrameId,
      fetchAssetFirst,
      saveWebFont
    } = params;
    Log.debug('getElemHtml', refUrl);
    const xpaths = ElemTool.getHiddenElementXpaths(win, elem);
    Log.debug(xpaths);
    let clonedElem = elem.cloneNode(true);
    clonedElem = ElemTool.removeChildByXpath(win, clonedElem, xpaths);
    clonedElem = T.completeElemLink(clonedElem, refUrl);
    const result = parseAssetInfo(clipId, clonedElem, mimeTypeDict);
    // deal internal style
    result.internalStyles = T.map(result.styleTexts, (styleText) => {
      return parseCss({
        clipId: clipId,
        path: path,
        styleText: styleText,
        refUrl: refUrl,
        mimeTypeDict: mimeTypeDict
      });
    });

    // deal external style
    downloadCssFiles(clipId, path, result.cssAssetInfos, mimeTypeDict, fetchAssetFirst, saveWebFont);

    // download assets
    StoreClient.addImages(clipId, path.assetFold, result.imgAssetInfos, fetchAssetFirst);


    const styleHtml = getExternalStyleHtml(path, result.cssAssetInfos) + getInternalStyleHtml(result.internalStyles);
    // deal frames
    handleFrames(params, clonedElem).then((clonedElem) => {
      let elemHtml = "";
      if(elem.tagName === 'BODY') {
        elemHtml = dealBodyElem(elem, clonedElem, refUrl, result, path);
      } else {
        elemHtml = dealNormalElem(elem, clonedElem, refUrl, result, path);
      }
      callback({ styleHtml: styleHtml, elemHtml: elemHtml});
    })

  }

  function handleFrames(params, clonedElem) {
    const topFrameId = 0;
    const {clipId, win, frames, path, mimeTypeDict,
      parentFrameId = topFrameId, fetchAssetFirst, saveWebFont} = params;
    return new Promise(function(resolve, _){
      // collect current layer frames

      const judgeDupPromises = [];
      const currLayerFrames = [];
      T.each(frames, (frame) => {
        if(parentFrameId === frame.parentFrameId && !T.isExtensionUrl(frame.url)) {
          const selector = `iframe[src="${frame.url}"]`;
          const frameElem = clonedElem.querySelector(selector);
          if(frameElem){
            currLayerFrames.push(frame);
            judgeDupPromises.push(KeyStore.add(frame.url));
          }
        }
      });

      if(judgeDupPromises.length === 0) {
        resolve(clonedElem);
      } else {
        Promise.all(judgeDupPromises)
          .then((values) => {
            T.each(values, (noDuplicate, index) => {
              const frame = currLayerFrames[index];
              const assetName = rewriteFrameSrc(clonedElem, frame);
              if(noDuplicate){
                ExtApi.sendMessageToBackground({
                  type: 'frame.toHtml',
                  to: frame.url,
                  frameId: frame.frameId,
                  body: {
                    clipId: clipId,
                    frames: frames,
                    path: path,
                    mimeTypeDict: mimeTypeDict,
                    fetchAssetFirst: fetchAssetFirst,
                    saveWebFont: saveWebFont
                  }
                }).then((frameHtml) => {
                  // render frameHtml and download frame
                  const {styleHtml, elemHtml} = frameHtml;
                  const html = MxWcTemplate.framePage.render({
                    originalSrc: frame.url,
                    title: win.document.title,
                    styleHtml: styleHtml,
                    html: elemHtml
                  });
                  TaskStore.save({
                    clipId: clipId,
                    type: 'text',
                    mimeType: 'text/html',
                    filename: T.joinPath([path.clipFold, assetName]),
                    text: html
                  })
                })
              }
            });
            resolve(clonedElem);
          });
      }
    });
  }


  function rewriteFrameSrc(clonedElem, frame) {
    const assetName = T.calcAssetName(frame.url, 'frame.html');
    const selector = `iframe[src="${frame.url}"]`;
    const frameElems = clonedElem.querySelectorAll(selector);
    T.each(frameElems, (frameElem) => {
      frameElem.src = assetName;
    });
    return assetName;
  }

  function dealBodyElem(elem, clonedElem, refUrl, parseResult, path) {
    let html = getFixedLinkHtml(path, clonedElem, refUrl, parseResult.imgAssetInfos);
    html = removeUselessHtml(html, elem);
    return html;
  }

  function dealNormalElem(elem, clonedElem, refUrl, parseResult, path){
    clonedElem = fixNormalElemStyle(clonedElem);
    let html = getFixedLinkHtml(path, clonedElem, refUrl, parseResult.imgAssetInfos);
    html = removeUselessHtml(html, elem);
    html = wrapToBody(elem, html);
    return html
  }

  function fixNormalElemStyle(elem) {
    const getFixedStyle = (element) => {
      return (element.style.cssText || '') + "float: none; position: relative; top: 0; left: 0; margin: 0px; flex:unset; width: 100%; max-width: 100%; box-sizing: border-box;";
    }
    elem.classList.add("mx-wc-selected-elem");
    elem.style = getFixedStyle(elem);
    return elem;
  }


  function getFixedLinkHtml(path, clonedElem, refUrl, imgAssetInfos) {
    clonedElem = ElemTool.rewriteAnchorLink(clonedElem, refUrl);
    let html = clonedElem.outerHTML;
    html = ElemTool.rewriteImgLink(html, path.assetRelativePath, imgAssetInfos)
    return html;
  }

  function removeUselessHtml(html, elem){
    // extension Iframe
    T.each(elem.querySelectorAll('iframe'), function(iframe){
      if(T.isExtensionUrl(iframe.src)){
        html = html.replace(iframe.outerHTML, '');
      }
    });
    // external style tags
    T.each(elem.querySelectorAll('link[rel=stylesheet]'), function(tag) {
      html = html.replace(tag.outerHTML, '');
    });
    T.each(['style', 'script', 'noscript', 'template'], function(tagName){
      T.each(elem.getElementsByTagName(tagName), function(tag){
        html = html.replace(tag.outerHTML, '');
      })
    });
    return html;
  }

  /*
   * assetInfo: {:tag, :link, :assetName}
   */
  function parseAssetInfo(clipId, clonedElem, mimeTypeDict){
    const listA = T.getTagsByName(clonedElem, 'img');
    const listB = T.getTagsByName(document, 'style');
    const listC = document.querySelectorAll("link[rel=stylesheet]");

    return {
      imgAssetInfos: ElemTool.getAssetInfos({
        clipId: clipId,
        assetTags: listA,
        attrName: 'src',
        mimeTypeDict: mimeTypeDict
      }),
      cssAssetInfos: ElemTool.getAssetInfos({
        clipId: clipId,
        assetTags: listC,
        attrName: 'href',
        mimeTypeDict: mimeTypeDict,
        extension: 'css'
      }),
      styleTexts: T.map(listB, (tag) => { return tag.innerHTML })
    }
  }

  function downloadCssFiles(clipId, path, assetInfos, mimeTypeDict, fetchAssetFirst, saveWebFont){
    T.each(assetInfos, function(it){
      KeyStore.add(it.link).then((canAdd) => {
        if(canAdd) {
          fetch(it.link).then(function(resp){
            return resp.text();
          }).then(function(txt){
            const cssText = parseCss({
              clipId: clipId,
              path: path,
              styleText: txt,
              refUrl: it.link,
              mimeTypeDict: mimeTypeDict,
              fetchAssetFirst: fetchAssetFirst,
              saveWebFont: saveWebFont
            });
            TaskStore.save({
              clipId: clipId,
              type: 'text',
              mimeType: 'text/css',
              filename: T.joinPath([path.assetFold, it.assetName]),
              text: cssText
            });
          }).catch((err) => {console.error(err)});
        }
      });
    });
  }


  function parseCss(params){
    const {clipId, path, refUrl, mimeTypeDict, fetchAssetFirst, saveWebFont} = params;
    let styleText = params.styleText;
    // FIXME danger here (order matter)
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
      const r = parseCssTextUrl({
        clipId: clipId,
        cssText: match,
        refUrl: refUrl,
        rules: [rule1, rule2, rule3],
        path: path,
        mimeTypeDict: mimeTypeDict,
        saveAsset: saveWebFont
      });
      StoreClient.addFonts(clipId, path.assetFold, r.assetInfos, fetchAssetFirst);
      return r.cssText;
    });

    // @import css
    const cssRegExp = /@import[^;]+;/igm;
    styleText = styleText.replace(cssRegExp, function(match){
      const r = parseCssTextUrl({
        clipId: clipId,
        cssText: match,
        refUrl: refUrl,
        rules: [rule11, rule12, rule13, rule14, rule15],
        path: path,
        mimeTypeDict: mimeTypeDict,
        extension: 'css',
        saveAsset: true
      });
      downloadCssFiles(clipId, path, r.assetInfos, mimeTypeDict, fetchAssetFirst, saveWebFont);
      return r.cssText;
    });

    return styleText;
  }

  function parseCssTextUrl(params){
    const {clipId, refUrl, rules, path, mimeTypeDict, extension, saveAsset} = params;
    let cssText = params.cssText;
    let assetInfos = [];
    const getReplace = function(rule){
      return function(match){
        const part = match.split(rule.separator)[1].trim();
        const fullUrl = T.prefixUrl(part, refUrl);
        if(T.isDataProtocol(fullUrl) || T.isHttpProtocol(fullUrl)) {

          if(saveAsset){
            const assetName = ElemTool.getAssetName({
              clipId: clipId,
              link: fullUrl,
              extension: extension,
              mimeTypeDict: mimeTypeDict
            });
            assetInfos.push({link: fullUrl, assetName: assetName});
            if(T.isUrlSameLevel(refUrl, window.location.href)){
              return rule.template.replace('$PATH', [path.assetRelativePath, assetName].join('/'));
            }else{
              return rule.template.replace('$PATH', assetName);
            }
          } else {
            // set path to blank
            return rule.template.replace('$PATH', '');
          }
        } else {
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

  function getElemRenderParams(elem){
    const bodyId = document.body.id;
    const bodyClass = document.body.className;
    if (elem.tagName === 'BODY') {
      return { bodyId: bodyId, bodyClass: bodyClass }
    } else {
      let bodyBgCss = getBgCss(document.body);
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
      const elemWidth = getFitWidth(elem);
      return {
        outerElemBgCss: outerElemBgCss,
        elemWidth: elemWidth,
        bodyBgCss: bodyBgCss,
        bodyId: bodyId,
        bodyClass: bodyClass,
      }
    }
  }




  /* wrap to body element */
  function wrapToBody(elem, html){
    let pElem = elem.parentElement;
    while(pElem && ['html', 'body'].indexOf(pElem.tagName.toLowerCase()) == -1){
      const tagName = pElem.tagName
      let attrs = []
      /* make sure highest priority */
      const displayCss = (tagName == 'table' ? 'display: table;' : 'display: block;');
      let style = displayCss + " float: none; position: relative; top: 0; left: 0; border: 0px; width: 100%; min-width:100%; max-width: 100%; min-height: auto; max-height: 100%; height: auto; padding: 0px; margin: 0px;"
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
  function getExternalStyleHtml(path, assetInfos){
    let html = "";
    T.each(assetInfos, function(it){
      const tag = it.tag.cloneNode(true);
      tag.removeAttribute('crossorigin');
      tag.removeAttribute('integrity');
      let part = tag.outerHTML;
      const href = tag.getAttribute('href');
      part = part.replace(href, [path.assetRelativePath, it.assetName].join('/'));
      part = part.replace(href.replace(/&/g, '&amp;'), [path.assetRelativePath, it.assetName].join('/'));

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

  return {
    parse: parse,
    getElemHtml: getElemHtml
  }
})();
