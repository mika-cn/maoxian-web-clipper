/**!
 * preprocess formula that render by katex(https://github.com/katex/katex)
 *
 * this module can handle belowing html structure
 *
 *   <span>
 *     <span class="katex">
 *       <span class="katex-mathml">
 *         <math>
 *           <semantics>
 *             <mrow>...MATHML_TREE...</mrow>
 *             <annotation encoding="application/x-tex">TEX_FORMULA</annotation>
 *           <semantics>
 *         </math>
 *       </span>
 *       <span class="katex-html">...</span>
 *     </span>
 *   </span>
 *
 *
 * version is: 0.16.0 when this module was created.
 */


function handle(doc, elem) {
  [].forEach.call(elem.querySelectorAll('.katex-mathml'), (mathmlNode) => {
    const {match, formula} = matchStructure(mathmlNode);
    if (match) { replaceFormula(mathmlNode, formula, doc) }
  });
  return elem;
}


function matchStructure(mathmlNode) {
  const nextSibling = mathmlNode.nextElementSibling;
  const pNode = mathmlNode.parentNode;
  if (!nextSibling) { return {match: false}}
  if (!pNode) { return {match: false}}
  if (!(nextSibling.classList.contains("katex-html") && pNode.children.length == 2)) {
    return {match: false};
  }
  if (!(pNode.parentNode && pNode.parentNode.tagName.toUpperCase() == 'SPAN')) {
    return {match: false}
  }

  const semanticsNode = mathmlNode.querySelector('semantics');
  if (!semanticsNode) {
    return {match: false}
  }

  const [firstElem, secondElem] = semanticsNode.children;
  if (
       firstElem.tagName.toUpperCase() == 'MROW'
    && secondElem.tagName.toUpperCase() == 'ANNOTATION'
    && secondElem.getAttribute('encoding')== 'application/x-tex'
  ) {
    // match the target structure;
    return {match: true, formula: secondElem.textContent.trim()}
  } else {
    return {match: false}
  }
}


function replaceFormula(mathmlNode, formula, doc) {
  let markerL, markerR;
  if (isCodeBlock(mathmlNode)) {
    markerL = 'KATEX_BLOCK___', markerR = '___KATEX_BLOCK';
  } else {
    markerL = 'KATEX___', markerR = '___KATEX';
  }

  const code = doc.createElement('code');
  code.textContent = markerL + formula + markerR;

  const katexNode = mathmlNode.parentNode;
  const nodes = [];
  [].map.call(katexNode.children, (it) => {
    return it;
  }).forEach((it) => katexNode.removeChild(it));
  katexNode.appendChild(code);
}


function isCodeBlock(mathmlNode) {
  const node = mathmlNode.parentNode.parentNode;
  return node.tagName.toUpperCase() == 'SPAN' && node.classList.contains('katex-display');
}


function unEscapeKatex(markdown, [blockWrapperL, blockWrapperR]) {
  return markdown
    .replace(/`KATEX___/mg, '$')
    .replace(/___KATEX`/mg, '$')
    .replace(/`KATEX_BLOCK___/mg, blockWrapperL)
    .replace(/___KATEX_BLOCK`/mg, blockWrapperR);
}

const MdPluginKatex = {handle, unEscapeKatex};

export default MdPluginKatex;
