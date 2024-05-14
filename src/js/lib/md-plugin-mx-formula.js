
/**!
 *
 * preprocess
 *   - <mx-inline-formula value="$FORMULA">
 *   - <mx-block-formula value="$FORMULA">
 */

function handle(doc, elem) {
  const selector = "mx-inline-formula, mx-block-formula";
  [].forEach.call(elem.querySelectorAll(selector),
    (node) => {handleMxFormula(node, doc)}
  );
  return elem;
}

function handleMxFormula(elem, doc) {
  const formula = (elem.getAttribute("value") || "").trim();
  if (!formula) { return }

  let markerL, markerR;
  if (elem.tagName == 'MX-BLOCK-FORMULA') {
    markerL = 'MX_FORMULA_BLOCK___';
    markerR = '___MX_FORMULA_BLOCK';
  } else {
    markerL = 'MX_FORMULA___';
    markerR = '___MX_FORMULA';
  }
  const code = doc.createElement('code');
  code.textContent = markerL + formula + markerR;
  elem.parentNode.replaceChild(code, elem);
}


function unEscapeMxFormula(markdown, [blockWrapperL, blockWrapperR]) {
  return markdown
    .replace(/`MX_FORMULA___/mg, '$')
    .replace(/___MX_FORMULA`/mg, '$')
    .replace(/`MX_FORMULA_BLOCK___/mg, blockWrapperL)
    .replace(/___MX_FORMULA_BLOCK`/mg, blockWrapperR);
}

const MdPluginMxFormula = {handle, unEscapeMxFormula};

export default MdPluginMxFormula;
