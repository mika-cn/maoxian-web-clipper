"use strict";

import MathML2LaTeX from 'mathml2latex';

// This plugin recognize MaoXian attribute: 'data-mx-formula-display'

function handle(doc, elem) {
  if(elem.tagName.toUpperCase() === 'MATH') {
    const newNode = toLaTeXNode(doc, elem);
    return newNode ? newNode : elem;
  } else{
    const nodes = elem.querySelectorAll('math');
    nodes.forEach(function(node) {
      const newNode = toLaTeXNode(doc, node);
      if(newNode){
        const pNode = node.parentNode;
        pNode.insertBefore(newNode, node);
        pNode.removeChild(node);
      }
    });
    return elem;
  }
}

function toLaTeXNode(doc, math) {
  const formulaDisplay = (math.getAttribute('data-mx-formula-display') || 'inline')
  const isFormulaBlock = (formulaDisplay == 'block');
  const latex = MathML2LaTeX.convert(math.outerHTML);
  // use code tag to avoid turndown escape '\';
  const newNode = doc.createElement('code');
  let markerL, markerR;
  if (isFormulaBlock) {
    markerL = "LATEX_BLOCK___";
    markerR = "___LATEX_BLOCK";
  } else {
    markerL = "LATEX_INLINE___";
    markerR = "___LATEX_INLINE";
  }
  newNode.textContent = markerL + latex + markerR;
  return newNode;
}

// unescape from code tag
function unEscapeLaTex(markdown){
  return markdown
    .replace(/`LATEX_INLINE___/mg, '$')
    .replace(/___LATEX_INLINE`/mg, '$')
    .replace(/`LATEX_BLOCK___/mg, '\n\n$$$')
    .replace(/___LATEX_BLOCK`/mg, '$$$\n\n');
}

const MdPluginMathML2LaTeX = { handle, handle, unEscapeLaTex: unEscapeLaTex}

export default MdPluginMathML2LaTeX;
