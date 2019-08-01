;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcMdPluginGist', [], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcMdPluginGist = factory();
  }
})(this, function(undefined) {
  "use strict";

  const gistClassPrefix = 'blob-wrapper data type-';

  function handle(win, elem) {
    if((new RegExp('^' + gistClassPrefix)).test(elem.className)){
      const codeNode = getCodeNode(win, elem);
      return codeNode ? codeNode : elem;
    }else{
      const divNodes = elem.querySelectorAll(`div[class^="${gistClassPrefix}"`);
      divNodes.forEach(function(divNode) {
        const codeNode = getCodeNode(win, divNode);
        if(codeNode){
          // replace gist node with code node
          const pNode = divNode.parentNode;
          pNode.insertBefore(codeNode, divNode);
          pNode.removeChild(divNode);
        }
      });
      return elem;
    }
  }

  function getCodeNode(win, gistDiv){
    const table = gistDiv.querySelector('table');
    if( table && table.className.indexOf('highlight') > -1) {
      const language = getLanguage(gistDiv);
      const tbody = table.querySelector('tbody');
      const trs = tbody.querySelectorAll('tr');
      const codeLines = [];
      trs.forEach((tr) => { codeLines.push(tr.children[1].innerText); });
      const code = codeLines.join("\n");
      const newNode = win.document.createElement('div');
      const className = `language-${language}`;
      newNode.className = className;
      newNode.innerHTML = `<pre><code class="${className}">${T.escapeHtml(code)}</code></pre>`;
      return newNode;
    } else {
      return null;
    }
  }


  function getLanguage(gistDiv){
    try{
      // language class name format: type-$ (e.g: type-c , type-js)
      return Array.prototype.filter.call(gistDiv.classList, (klass) => {
        return !!(klass.match(/^type-/));
      })[0].split('-').pop();
    }catch(e){
      return 'text';
    }
  }

  return { handle: handle }
});
