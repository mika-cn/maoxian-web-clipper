// Based on turndown-plugin-gfm (v1.0.2)
//
// New: Skip empty tables and layout tables (it will render without border)
// New: Always render tables even if they don't have a header.

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
  filter: function (node) {
    return node.nodeName === 'TABLE'
  },

  replacement: function (content, node) {
    if (shouldSkipTable(node)) return content;

    // Ensure there are no blank lines
    content = content.replace(/\n+/g, '\n');

    // If table has no heading, add an empty one so as to get a valid Markdown table
    var secondLine = content.trim().split('\n');
    if (secondLine.length >= 2) secondLine = secondLine[1]
    var secondLineIsDivider = secondLine.indexOf('| ---') === 0

    var columnCount = tableColCount(node);
    var emptyHeader = ''
    if (columnCount && !secondLineIsDivider) {
      emptyHeader = '|' + '     |'.repeat(columnCount) + '\n' + '|' + ' --- |'.repeat(columnCount)
    }

    return '\n\n' + emptyHeader + content + '\n\n'

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


// @param {HTMLTableElement} node
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

export default function tables (turndownService) {
  // FIXME
  // turndownService.keep(function (node) {
  //   return node.nodeName === 'TABLE'
  // });
  for (var key in rules) turndownService.addRule(key, rules[key]);
}

