/**!
 *
 * ===========
 * The problem
 * ===========
 *
 *   Turndown convert block elements to `\n\n xxx \n\n`,
 * and some progamers use <div> to wrap <img> inside. and
 * to make the whole block clickable, wrap it inside <a>.
 * like this:
 *   <a href="https://example.org/link">
 *     <div><img src="image.png"></div>
 *   </a>
 *
 * So, turndown will convert it to:
 *
 *   [
 *
 *   ![](image.png)
 *
 *   ](https://example.org/link)
 *
 * which contains unnecessary spaces, it'll cause markdown reader
 * not able to render it correctly.
 *
 *
 * ==================
 * Current fix
 * ==================
 *
 * We turn
 *
 * <a>
 *   <block-element><img><block-element>
 * </a>
 *
 * to:
 *
 * <block-element>
 *   <a>
 *     <block-element data-mx-ignore-me="1"><img></block-element>
 *   </a>
 * </block-element>
 *
 *
 */


function handle(doc, elem) {
  handleImgBlock(doc, elem);
  // TODO other block links need to fix.
  return elem;
}


function handleImgBlock(doc, elem) {
  const selector = [
    "a>div>img"     , "a>figure>img",
    "a>div>picture" , "a>figure>picture",
  ].join(",");

  [].forEach.call(elem.querySelectorAll(selector), (it) => {
    const block = it.parentNode;
    if (isTheOnlyChild(block)) {
      markBlockLink(block);
    }
  });
}


function markBlockLink(block) {
  block.setAttribute('data-mx-ignore-me', '1');
  const anchor = block.parentNode;
  const wrapper = document.createElement(block.tagName);
  anchor.parentNode.insertBefore(wrapper, anchor);
  wrapper.appendChild(anchor);
}



function isTheOnlyChild(elem) {
  return (!elem.previousElementSibling && !elem.nextElementSibling
      && (!elem.previousSibling || isBlankTextNode(elem.previousSibling))
      && (!elem.nextSibling     || isBlankTextNode(elem.nextSibling))
  );
}

function isBlankTextNode(node) {
  return node.nodeType == 3 && node.textContent.match(/^\s*$/mg);
}

function copyAttributes(elem, fromElem) {
  [].forEach.call(fromElem.attributes, (attr) => {
    elem.setAttribute(attr.name, attr.value);
  });
}

export default {handle}
