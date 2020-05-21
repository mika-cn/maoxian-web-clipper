"use strict";

const MathML2LaTeX = require('../../vendor/js/mathml2latex.js');

function handle(doc, elem) {
  const mathJaxScripts = elem.querySelectorAll('script[id^=MathJax-Element-]');
  Array.prototype.forEach.call(mathJaxScripts, (mathJaxScript) => {
    const mathJaxFrameId = [mathJaxScript.id, 'Frame'].join('-');
    const mathJaxFrame = elem.querySelector('#' + mathJaxFrameId);
    if(mathJaxFrame) {
      let newNode = null;
      switch(mathJaxScript.type){
        case "math/tex":
          newNode = toTeXNode(doc, mathJaxScript.innerText)
          break;
        case "math/mml":
          newNode = mathMLHtml2TeXNode(doc, mathJaxScript.innerText)
          break;
        default: break;
      }
      if(!newNode){
        const dataMathml = mathJaxFrame.getAttribute('data-mathml');
        if(dataMathml && dataMathml.match(/^<math/)){
          newNode = mathMLHtml2TeXNode(doc, dataMathml);
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

function mathMLHtml2TeXNode(doc, mathMLHtml) {
  const teX = MathML2LaTeX.convert(mathMLHtml);
  return toTeXNode(doc, teX);
}

function toTeXNode(doc, teX) {
  const newNode = doc.createElement('code');
  newNode.innerText = "MathJaxTeX " + teX + " MathJaxTeX";
  return newNode;
}

function unEscapeMathJax(markdown){
  return markdown.replace(/`MathJaxTeX /mg, '$ ').replace(/ MathJaxTeX`/mg, ' $');
}

const MdPluginMathjax = {
  handle: handle,
  unEscapeMathJax: unEscapeMathJax
};

export default MdPluginMathjax;
