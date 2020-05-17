"use strict";

const MathML2LaTeX = require('../../vendor/js/mathml2latex.js');

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
  const latex = MathML2LaTeX.convert(math.outerHTML);
  // use code tag to avoid turndown escape '\';
  const newNode = doc.createElement('code');
  newNode.innerText = "LaTeX " + latex + " LaTeX";
  return newNode;
}

// unescape from code tag
function unEscapeLaTex(markdown){
  return markdown.replace(/`LaTeX /mg, '$ ').replace(/ LaTeX`/mg, ' $');
}

const MdPluginMathML2LaTeX = { handle, handle, unEscapeLaTex: unEscapeLaTex}

export default MdPluginMathML2LaTeX;
