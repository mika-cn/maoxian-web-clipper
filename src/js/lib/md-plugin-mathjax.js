"use strict";

import T from './tool.js';
import MathML2LaTeX from 'mathml2latex';

function handle(doc, elem) {
  const mathJaxScripts = elem.querySelectorAll('script[id^=MathJax-Element-]');
  Array.prototype.forEach.call(mathJaxScripts, (mathJaxScript) => {
    const mathJaxFrameId = [mathJaxScript.id, 'Frame'].join('-');
    const mathJaxFrame = elem.querySelector('#' + mathJaxFrameId);
    // type: "math/tex", "math/tex;" or "math/tex; xxx"
    const mathJaxType = mathJaxScript.type.split(";")[0];
    if(mathJaxFrame) {
      let newNode = null;
      switch(mathJaxType){
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
  newNode.innerText = "MATHJAX_TEX___" + T.escapeCodeNodeText(teX) + "___MATHJAX_TEX";
  return newNode;
}

function unEscapeMathJax(markdown){
  return markdown.replace(/`MATHJAX_TEX___/mg, '$').replace(/___MATHJAX_TEX`/mg, '$');
}

const MdPluginMathjax = {
  handle: handle,
  unEscapeMathJax: unEscapeMathJax
};

export default MdPluginMathjax;
