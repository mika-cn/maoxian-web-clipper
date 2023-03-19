// Based on turndown-plugin-gfm (v1.0.2)
//
// New: Skip empty tables and layout tables (it will render without border)
// New: Replace newlines (\n) with <br> inside table cells so that multi-line content is displayed correctly as Markdown.
// New: Table cells are at least three characters long (padded with spaces) so that they render correctly in GFM-compliant renderers.
// New: Handle colspan in TD tags
// Fixed: Ensure there are no blank lines inside tables (due for example to an empty <tr> tag)
// Fixed: Fixed importing tables that contain pipes.


var indexOf = Array.prototype.indexOf;
var every = Array.prototype.every;
var rules = {};

rules.tableCell = {
  filter: ['th', 'td'],
  replacement: function (content, node) {
    if (shouldSkipTable(getTableNode(node))) return "\n\n" + content;
    return cell(content, node)
  }
};

rules.tableRow = {
  filter: 'tr',
  replacement: function (content, node) {
    const table = getTableNode(node);
    if (shouldSkipTable(table)) return "\n\n" + content;

    var borderCells = '';
    var alignMap = { left: ':--', right: '--:', center: ':-:' };

    if (isHeadingRow(node)) {
      const colCount = tableColCount(table);

      for (var i = 0; i < colCount; i++) {
        const childNode = colCount >= node.childNodes.length ? null : node.childNodes[i];
        var border = '---';
        var align = childNode ? (childNode.getAttribute('align') || '').toLowerCase() : '';

        if (align) border = alignMap[align] || border;

        if (childNode) {
          borderCells += cell(border, node.childNodes[i])
        } else {
          borderCells += cell(border, null, i);
        }
      }
    }
    return '\n' + content + (borderCells ? '\n' + borderCells : '')
  }
};

rules.table = {
  filter: function (node) {
    return node.nodeName === 'TABLE' && (isLayoutTable(node) || isHeadingRow(node.rows[0]));
  },

  replacement: function (content, node) {
    if (shouldSkipTable(node)) return content;

    // Ensure there are no blank lines
    content = content.replace(/\n+/g, '\n');
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


// get from joplin
function cell (content, node = null, index = null) {
  if (index === null) index = indexOf.call(node.parentNode.childNodes, node)
  var prefix = ' '
  if (index === 0) prefix = '| '
  let filteredContent = content.trim().replace(/\n\r/g, '<br>').replace(/\n/g, "<br>");
  filteredContent = filteredContent.replace(/\|+/g, '\\|')
  while (filteredContent.length < 3) filteredContent += ' ';
  if (node) filteredContent = handleColSpan(filteredContent, node, ' ');
  return prefix + filteredContent + ' |'
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
  return it.hasAttribute('data-mx-layout-table')
}

// @param {HTMLTableElement} it
function isEmptyTable(it) {
  return !(it && it.rows.length > 0);
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

// get from joplin
function handleColSpan(content, node, emptyChar) {
  const colspan = node.getAttribute('colspan') || 1;
  for (let i = 1; i < colspan; i++) {
    content += ' | ' + emptyChar.repeat(3);
  }
  return content
}



// ********** end **********

export default function tables (turndownService) {
  turndownService.keep(function (node) {
    return node.nodeName === 'TABLE' && !isLayoutTable(node) && !isHeadingRow(node.rows[0])
  });
  for (var key in rules) turndownService.addRule(key, rules[key]);
}

