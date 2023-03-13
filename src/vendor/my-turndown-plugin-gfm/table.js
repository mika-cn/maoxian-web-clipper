// Based on turndown-plugin-gfm (v1.0.2)
//
// [new] skip empty tables and layout tables (it will render without border)

var indexOf = Array.prototype.indexOf;
var every = Array.prototype.every;
var rules = {};

rules.tableCell = {
  filter: ['th', 'td'],
  replacement: function (content, node) {
    if (shouldSkipTable(getTableNode(node))) return content;
    return cell(content, node)
  }
};

rules.tableRow = {
  filter: 'tr',
  replacement: function (content, node) {
    if (shouldSkipTable(getTableNode(node))) return content;

    var borderCells = '';
    var alignMap = { left: ':--', right: '--:', center: ':-:' };

    if (isHeadingRow(node)) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var border = '---';
        var align = (
          node.childNodes[i].getAttribute('align') || ''
        ).toLowerCase();

        if (align) border = alignMap[align] || border;

        borderCells += cell(border, node.childNodes[i]);
      }
    }
    return '\n' + content + (borderCells ? '\n' + borderCells : '')
  }
};

rules.table = {
  // Only convert tables with a heading row.
  // Tables with no heading row are kept using `keep` (see below).
  filter: function (node) {
    return node.nodeName === 'TABLE' && isHeadingRow(node.rows[0])
  },

  replacement: function (content, node) {
    if (shouldSkipTable(node)) return content;

    // Ensure there are no blank lines
    content = content.replace('\n\n', '\n');
    return '\n\n' + content + '\n\n'
  }
};

rules.tableSection = {
  filter: ['thead', 'tbody', 'tfoot'],
  replacement: function (content) {
    return content
  }
};

// A tr is a heading row if:
// - the parent is a THEAD
// - or if its the first child of the TABLE or the first TBODY (possibly
//   following a blank THEAD)
// - and every cell is a TH
function isHeadingRow (tr) {
  var parentNode = tr.parentNode;
  return (
    parentNode.nodeName === 'THEAD' ||
    (
      parentNode.firstChild === tr &&
      (parentNode.nodeName === 'TABLE' || isFirstTbody(parentNode)) &&
      every.call(tr.childNodes, function (n) { return n.nodeName === 'TH' })
    )
  )
}

function isFirstTbody (element) {
  var previousSibling = element.previousSibling;
  return (
    element.nodeName === 'TBODY' && (
      !previousSibling ||
      (
        previousSibling.nodeName === 'THEAD' &&
        /^\s*$/i.test(previousSibling.textContent)
      )
    )
  )
}

function cell (content, node) {
  var index = indexOf.call(node.parentNode.childNodes, node);
  var prefix = ' ';
  if (index === 0) prefix = '| ';
  return prefix + content + ' |'
}

// ********** functions that add by us **********

// returns the nearest one.
function getTableNode(node) {
  let currNode = node;
  while (currNode && currNode.nodeName !== 'TABLE') {
    currNode = currNode.parentNode;
  }
  return currNode;
}


// @param {HTMLTableElement} it
function shouldSkipTable(it) {
  return isEmptyTable(it) || isLayoutTable(it);
}


// @param {HTMLTableElement} it
function isLayoutTable(it) {
  return it.hasAttribute('data-layout-table') || isOneCellTable(it);
}


// @param {HTMLTableElement} it
function isEmptyTable(it) {
  return !(it && it.rows.length > 0);
}

// @param {HTMLTableElement} it
function isOneCellTable(it) {
  if(!hasOneBodyOnly(it)) { return false }
  return it.rows.length == 1 && it.rows[0].cells.length == 1;
}


// @param {HTMLTableElement} it
function hasOneBodyOnly(it) {
  return (
    it.tHead === null && it.tFoot === null && it.caption == null
    && it.tBodies && it.tBodies.length == 1
  );
}

// ********** end **********

export default function tables (turndownService) {
  turndownService.keep(function (node) {
    return node.nodeName === 'TABLE' && !isHeadingRow(node.rows[0])
  });
  for (var key in rules) turndownService.addRule(key, rules[key]);
}

