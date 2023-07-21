

import T from './tool.js';
import MathML2LaTeX from 'mathml2latex';

// Note that this formula only handle MathJAX 2.x

function handle(doc, elem) {
  const mathJaxScripts = elem.querySelectorAll('script[id^=MathJax-Element-]');
  Array.prototype.forEach.call(mathJaxScripts, (mathJaxScript) => {
    const mathJaxFrameId = [mathJaxScript.id, 'Frame'].join('-');
    const mathJaxFrame = elem.querySelector('#' + mathJaxFrameId);

    // get mathjax mode from type attribute
    // type: "math/tex", "math/tex;" or "math/tex; mode=display"
    const parts = (mathJaxScript.type || "").split(";").map(it => it.trim().toLowerCase());
    const mathJaxType = parts[0];
    const isBlockFormula = (parts[1] && parts[1] === 'mode=display' ? true : false)

    if(mathJaxFrame) {
      let newNode = null;
      switch(mathJaxType){
        case "math/tex":
          newNode = toTeXNode(doc, mathJaxScript.textContent, isBlockFormula)
          break;
        case "math/mml":
          newNode = mathMLHtml2TeXNode(doc, mathJaxScript.textContent, isBlockFormula)
          break;
        default: break;
      }
      if(!newNode){
        const dataMathml = mathJaxFrame.getAttribute('data-mathml');
        if(dataMathml && dataMathml.match(/^<math/)){
          newNode = mathMLHtml2TeXNode(doc, dataMathml, isBlockFormula);
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

function mathMLHtml2TeXNode(doc, mathMLHtml, isBlockFormula = false) {
  const teX = MathML2LaTeX.convert(mathMLHtml);
  return toTeXNode(doc, teX, isBlockFormula);
}

function toTeXNode(doc, teX, isBlockFormula = false) {
  const newNode = doc.createElement('code');
  let markerL, markerR;
  if (isBlockFormula) {
    markerL = "MATHJAX_TEX_BLOCK___";
    markerR = "___MATHJAX_TEX_BLOCK";
  } else {
    markerL = "MATHJAX_TEX_INLINE___";
    markerR = "___MATHJAX_TEX_INLINE";
  }
  newNode.textContent = markerL + T.escapeCodeNodeText(teX) + markerR;
  return newNode;
}

function unEscapeMathJax(markdown){
  return markdown
    .replace(/`MATHJAX_TEX_INLINE___/mg, '$')
    .replace(/___MATHJAX_TEX_INLINE`/mg, '$')
    .replace(/`MATHJAX_TEX_BLOCK___/mg, '\n\n$$$')
    .replace(/___MATHJAX_TEX_BLOCK`/mg, '$$$\n\n');
}

const MdPluginMathjax = {
  handle: handle,
  unEscapeMathJax: unEscapeMathJax
};

export default MdPluginMathjax;
