
import Log     from './log.js';
import DOMTool from './dom-tool.js';

const LAYOUT_TABLE = 'data-mx-layout-table';

function handle(doc, contextNode) {
  const nodes = DOMTool.querySelectorIncludeSelf(contextNode, 'table');
  [].forEach.call(nodes, (it) => {
    const marked = markLayoutTable(it);
    if (!marked) {
      addEmptyHeader(doc, it)
    }
  });
  return contextNode;
}


function addEmptyHeader(doc, it) {
  if (!hasHeaderRow(it) && !it.tHead && it.tBodies && it.tBodies.length > 0) {
    const tHeader = doc.createElement('thead');
    const tr = doc.createElement('tr');
    const colCount = tableColCount(it);
    for (let i = 0; i < colCount; i++) {
      const th = doc.createElement('th');
      // Table cells are at least three characters long (padded with spaces)
      // so that they render correctly in GitHub Flavor Markdown compliant renderers.
      th.innerHTML = '   ';
      tr.appendChild(th);
    }
    tHeader.appendChild(tr);
    it.insertBefore(tHeader, it.tBodies[0]);
  }
}


function hasHeaderRow(it) {
  return it.rows && [].find.call(it.rows, isHeadingRow) !== undefined;
}


// ********** copy from turndown-plugin-gfm or joplin@turndown-plugin-gfm **********


// A tr is a heading row if:
// - the parent is a THEAD
// - or if its the first child of the TABLE or the first TBODY (possibly
//   following a blank THEAD)
// - and every cell is a TH
//
function isHeadingRow (tr) {
  var parentNode = tr.parentNode
  return (
    parentNode.nodeName === 'THEAD' ||
    (
      parentNode.firstChild === tr &&
      (parentNode.nodeName === 'TABLE' || isFirstTbody(parentNode)) &&
      [].every.call(tr.childNodes, function (n) { return n.nodeName === 'TH' })
    )
  )
}

function isFirstTbody (tBody) {
  const table = tBody.parentNode;
  return table.tBodies && table.tBodies[0] == tBody;
}



function tableColCount(node) {
  let maxColCount = 0;
  for (let i = 0; i < node.rows.length; i++) {
    const row = node.rows[i]
    const colCount = row.childNodes.length
    if (colCount > maxColCount) maxColCount = colCount
  }
  return maxColCount
}


// ********** end **********


// @param {HTMLTableElement} it
// @returns {boolean} true for marked
function markLayoutTable(it) {
  if (it.hasAttribute(LAYOUT_TABLE)) {
    // already marked, do nothing
    return true;
  }
  if (isOneCellTable(it)) {
    it.setAttribute(LAYOUT_TABLE, '1');
    return true;
  }
  return false;
}

// @param {HTMLTableElement} it
function isOneCellTable(it) {
  if(!hasOneBodyOnly(it)) { return false }
  return it.rows && it.rows.length == 1 && it.rows[0].cells.length == 1;
}

// @param {HTMLTableElement} it
function hasOneBodyOnly(it) {
  return (
    it.tHead === null && it.tFoot === null && it.caption == null
    && it.tBodies && it.tBodies.length == 1
  );
}


export default {handle}
