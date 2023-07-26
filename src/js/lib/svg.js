
// Some programer use global defined SVG
// and referrence it from another SVG.
//
// MathJax use it to render SVG output.
function getGlobalDefinedElements() {
  const elems = [];
  [].forEach.call(document.querySelectorAll('svg'), (it) => {
    const hasNotUseElements = it.querySelectorAll('use[href]').length == 0;
    const hasDefinedElements = it.querySelectorAll('[id]').length > 0;
    if (hasNotUseElements && hasDefinedElements) {
      elems.push(it);
    }
  });
  return elems;
}

export default {getGlobalDefinedElements};
