;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(require('../lib/tool.js'));
  } else {
    // browser or other
    root.MxWcElemTool = factory(root.MxWcTool);
  }
})(this, function(T, undefined) {
  "use strict";

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

  ElemTool.isIndivisible = (elem, pElem) => {
    if(elem && pElem) {
      return [
        ['CODE' , 'PRE'],
        ['THEAD', 'TABLE'],
        ['TBODY', 'TABLE']
      ].some((p) => elem.tagName === p[0] && pElem.tagName === p[1])
    } else {
      return false;
    }
  }

  ElemTool.getHiddenElementXpaths = (win, elem, prefix="") => {
    let xpaths = [];
    T.each(elem.children, (childElem, index) => {
      const xpath = [prefix, '*[', index + 1, ']'].join('');
      if(T.isElemVisible(win, childElem)) {
        xpaths = xpaths.concat(ElemTool.getHiddenElementXpaths(
          win, childElem, xpath + '/'));
      } else {
        let marked = childElem.getAttribute('data-mx-hidden-node');
        xpaths.push(xpath);
      }
    })
    return xpaths;
  }

  ElemTool.getFrameBySrc = function(container, src) {
    if(['IFRAME', 'FRAME'].indexOf(container.tagName) > -1 && container.src === src) {
      return container;
    } else {
      const frame = container.querySelector(`iframe[src="${src}"]`);
      if(frame) { return frame; }
      return container.querySelector(`frame[src="${src}"]`);
    }
  }

  return ElemTool;
});
