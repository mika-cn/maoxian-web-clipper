;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcMdPluginMisc', [], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcMdPluginMisc = factory();
  }
})(this, function(undefined) {
  "use strict";

  function handle(win, elem) {
    fixCodeBrTag(elem);
    return elem;
  }

  /*
   * some markdown render render code line-break to <br>, even it's in <pre> tag
   * turndown library use codeNode.dom.textContent directly
   * convert <br> tag to "\n"
   */
  function fixCodeBrTag(elem){
    const codes = elem.querySelectorAll('code');
    codes.forEach(function(code) {
      if(code.parentNode.tagName === 'PRE'){
        // code block
        code.innerHTML = code.innerHTML.replace(/<br\s{0,1}\/{0,1}>/img, "\n");
      }
    })
  }

  return {handle: handle};
});
