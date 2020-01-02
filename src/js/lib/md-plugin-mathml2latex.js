;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcMdPluginMathML2LaTeX = factory();
  }
})(this, function(undefined) {
  "use strict";

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

  return { handle, handle, unEscapeLaTex: unEscapeLaTex}
});
