"use strict";

import Log from '../lib/log.js';
import T   from '../lib/tool.js';

function getRenderParams(elem, win){
  const {
       id: htmlId,
    klass: htmlClass,
    style: htmlStyle
  } = extractCssAttrs(win.document.documentElement);
  let htmlAppendStyle = '';
  if (!isOverflowDefault(win.document.documentElement, win)) {
    htmlAppendStyle = 'overflow: auto !important;';
  }

  if (elem.tagName.toUpperCase() === 'BODY') {
    return {
      htmlIdAttr: renderAttr('id', htmlId),
      htmlClassAttr: renderAttr('class', htmlClass),
      htmlStyleAttr: renderAttr('style', htmlStyle + htmlAppendStyle),
    }

  } else {
    const {id: bodyId, klass: bodyClass} = extractCssAttrs(win.document.body);
    let bodyBgCss = getBgCss(win.document.body, win);
    const elemWrappers = getWrappers(elem, [], win);
    const outerElem = elemWrappers.length > 0 ? elemWrappers[elemWrappers.length - 1] : elem
    const outerElemBgCss = getBgCss(outerElem, win);
    const elemBgCss = getBgCss(elem, win);
    Log.debug('elemBgCss:', elemBgCss);
    Log.debug('outerElemBgCss:', outerElemBgCss);
    Log.debug('bodyBgCss:', bodyBgCss);
    if(elemBgCss == outerElemBgCss){
      const [r,g,b] = T.extractRgbStr(outerElemBgCss);
      if(r == g && g == b && r - 70 >= 86){
        // condition above means: color lighter than #868686
        bodyBgCss = '#464646';
      }else{
        //TODO use opposite color?
        bodyBgCss = '#ffffff';
      }
    }else{
      if(elemBgCss == bodyBgCss || outerElemBgCss == bodyBgCss){
        bodyBgCss = '#464646';
      }
    }
    const elemWidth = getFitWidth(elem, win);
    return {
      elemWidth      : elemWidth,
      bodyBgCss      : bodyBgCss,
      outerElemBgCss : outerElemBgCss,
      bodyIdAttr     : renderAttr('id', bodyId),
      bodyClassAttr  : renderAttr('class', bodyClass),
      htmlIdAttr     : renderAttr('id', htmlId),
      htmlClassAttr  : renderAttr('class', htmlClass),
      htmlStyleAttr  : renderAttr('style', htmlStyle + htmlAppendStyle),
    }
  }
}

// calculate selected elem backgroundColor
// TODO check other browser represent background as 'rgb(x,x,x,)' format
function getBgCss(elem, win){
  if(!elem){
    return "rgb(255, 255, 255)";
  }//  default white;
  const bgCss = win.getComputedStyle(elem, null).getPropertyValue('background-color');
  if(bgCss == "rgba(0, 0, 0, 0)"){ // transparent
    return getBgCss(elem.parentElement, win);
  }else{
    return bgCss;
  }
}


function getWrappers(elem, wrapperList, win){
  const pElem = elem.parentElement;
  if(pElem && ['HTML', 'BODY'].indexOf(pElem.tagName.toUpperCase()) == -1){
    if(pElemHasNearWidth(pElem, elem, win) || siblingHasSameStructure(elem)){
      // probably is a wrapper
      wrapperList.push(pElem);
      return getWrappers(pElem, wrapperList, win);
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
  if(elemA.tagName.toUpperCase() != elemB.tagName.toUpperCase()){ return false }
  const listA = T.unique(elemA.classList);
  const listB = T.unique(elemB.classList);
  const list = T.intersection(listA, listB)
  return list.length === Math.min(listA.length, listB.length);
}


function pElemHasNearWidth(pElem, elem, win){
  const threshold = 10; //10px
  const box = elem.getBoundingClientRect();
  const pBox = pElem.getBoundingClientRect();
  const margin  = getCssSize(elem, 'margin-left', win) + getCssSize(elem, 'margin-right', win);
  return pBox.width - (box.width + margin) < threshold
}

function getFitWidth(elem, win){
  const width = elem.getBoundingClientRect().width;
  const widthText = getStyleText(elem, 'width', win)
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
function getStyleText(elem, cssKey, win){
  const style = win.getComputedStyle(elem, null);
  const display = style.getPropertyValue("display");
  elem.style.display = "none";
  const value = style.getPropertyValue(cssKey);
  elem.style.display = display;
  return value;
}

function getCssSize(elem, cssKey, win){
  const style = win.getComputedStyle(elem, null);
  let size = style.getPropertyValue(cssKey);
  size.replace('px', '');
  if(size === ''){
    return 0;
  }else{
    return parseInt(size);
  }
}

function getWrapperStyle(node) {
  const cssObj = {
    'display'    : 'block',
    'float'      : 'none',
    'position'   : 'relative',
    'transform'  : 'initial',
    'top'        : '0',
    'left'       : '0',
    'border'     : '0px',
    'width'      : '100%',
    'min-width'  : '100%',
    'max-width'  : '100%',
    'height'     : 'auto',
    'min-height' : 'auto',
    'max-height' : '100%',
    'margin'     : '0px',
    'padding'    : '0px',
  }

  if (node.tagName.toUpperCase() === 'TABLE') {
    cssObj['display'] = 'table';
  }

  return (node.style.cssText || '') + toCssText(cssObj);
}

function getSelectedNodeStyle(node, win) {
  const cssObj = {
    'float'      : 'none',
    'position'   : 'relative',
    'top'        : '0',
    'left'       : '0',
    'margin'     : '0px',
    'flex'       : 'unset',
    'width'      : '100%',
    'max-width'  : '100%',
  };

  if (getStyleText(node, 'box-sizing', win) !== 'border-box') {
    cssObj['box-sizing'] = 'border-box';
  }

  const marginLeft  = getCssSize(node, 'margin-left', win);
  const paddingLeft = getCssSize(node, 'padding-left', win);
  const marginTop   = getCssSize(node, 'margin-top', win);
  const paddingTop  = getCssSize(node, 'padding-top', win);

  if (marginLeft !== 0 && (marginLeft + paddingLeft) == 0) {
    // Some programers write code like this :(
    cssObj['padding-left'] = `${paddingTop}px`;
  }

  if (marginTop !== 0 && (marginTop + paddingTop) == 0) {
    cssObj['padding-top'] = `${paddingLeft}px`;
  }

  return (node.style.cssText || '') + toCssText(cssObj);
}

function toCssText(cssObj) {
  let r = '';
  for (let k in cssObj) {
    r += `${k}: ${cssObj[k]} !important;`;
  }
  return r;
}

function isOverflowDefault(node, win) {
  const overflow  = getStyleText(node, 'overflow', win),
        overflowX = getStyleText(node, 'overflow-x', win),
        overflowY = getStyleText(node, 'overflow-y', win);
  return (
    overflow === overflowX &&
    overflow === overflowY &&
    overflow === 'visible'
  );
}

function extractCssAttrs(node) {
  return {
    id: node.getAttribute('id') || "",
    klass: node.getAttribute('class') || "",
    style: node.getAttribute('style') || "",
  }
}

function renderAttr(name, value) {
  return value ? ` ${name}="${value}"` : '';
}

const StyleHelper = {
  getRenderParams: getRenderParams,
  getSelectedNodeStyle: getSelectedNodeStyle,
  getWrapperStyle: getWrapperStyle,
}

export default StyleHelper;
