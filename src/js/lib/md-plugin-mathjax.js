;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcMdPluginMathjax', [], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcMdPluginMathjax = factory();
  }
})(this, function(undefined) {
  "use strict";

  function handle(win, elem) {
    const mathJaxScripts = elem.querySelectorAll('script[id^=MathJax-Element-]');
    Array.prototype.forEach.call(mathJaxScripts, (mathJaxScript) => {
      const mathJaxFrameId = [mathJaxScript.id, 'Frame'].join('-');
      const mathJaxFrame = elem.querySelector('#' + mathJaxFrameId);
      if(mathJaxFrame) {
        let newNode = null;
        switch(mathJaxScript.type){
          case "math/tex":
            newNode = toTeXNode(win, mathJaxScript.innerText)
            break;
          case "math/mml":
            newNode = mathMLHtml2TeXNode(win, mathJaxScript.innerText)
            break;
          default: break;
        }
        if(!newNode){
          const dataMathml = mathJaxFrame.getAttribute('data-mathml');
          if(dataMathml && dataMathml.match(/^<math/)){
            newNode = mathMLHtml2TeXNode(win, dataMathml);
          }
        }
        if(newNode){
          const pNode = mathJaxFrame.parentNode;
          pNode.insertBefore(newNode, mathJaxFrame);
          pNode.removeChild(mathJaxFrame);
        }
      }
    });
    return elem;
  }

  function mathMLHtml2TeXNode(win, mathMLHtml) {
    const teX = MathML2LaTeX.convert(mathMLHtml);
    return toTeXNode(win, teX);
  }

  function toTeXNode(win, teX) {
    const newNode = win.document.createElement('code');
    newNode.innerText = "MathJaxTeX " + teX + " MathJaxTeX";
    return newNode;
  }

  function unEscapeMathJax(markdown){
    return markdown.replace(/`MathJaxTeX /mg, '$ ').replace(/ MathJaxTeX`/mg, ' $');
  }

  return {
    handle: handle,
    unEscapeMathJax: unEscapeMathJax
  };
});
