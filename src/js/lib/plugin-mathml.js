
"use strict";

this.PluginMathML2LaTeX = (function(){

  function handle(win, elem) {
    if(elem.tagName === 'MATH') {
      const newNode = toLaTeXNode(win, elem);
      return newNode ? newNode : elem;
    } else{
      const nodes = elem.querySelectorAll('math');
      nodes.forEach(function(node) {
        const newNode = toLaTeXNode(win, node);
        if(newNode){
          const pNode = node.parentNode;
          pNode.insertBefore(newNode, node);
          pNode.removeChild(node);
        }
      });
      return elem;
    }
  }

  function toLaTeXNode(win, math) {
    const latex = MathML2LaTeX.convert(math.outerHTML);
    console.log('latex: ', latex);
    // use code tag to avoid turndown escape '\';
    const newNode = win.document.createElement('code');
    newNode.innerText = "LaTeX " + latex + " LaTeX";
    return newNode;
  }

  // unescape from code tag
  function unEscapeLaTex(markdown){
    return markdown.replace(/`LaTeX /mg, '$ ').replace(/ LaTeX`/mg, ' $');
  }

  return { handle, handle, unEscapeLaTex: unEscapeLaTex}
})();
