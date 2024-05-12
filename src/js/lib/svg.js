
// Some programer use global defined SVG
// and referrence it from another SVG.
//
// This behavior makes <svg>s are not self-contained anymore...
//
// example: MathJax use it to render SVG output.
//
function getGlobalDefinedElements() {
  const svgs = document.querySelectorAll('svg')
  const dict = new Map(); // svg => idInfo
  let externalIds = [];

  [].forEach.call(svgs, (it) => {
    const idInfo = getIdInfo(it);
    if (idInfo.externalIds.length > 0) {
      externalIds = [...externalIds, ...idInfo.externalIds];
    }
    dict.set(it, idInfo);
  });


  if (externalIds.length > 0) {
    const elems = [];
    for (const it of svgs) {
      const idInfo = dict.get(it);
      if (idInfo.definedIds.size == 0) {
        continue;
      }
      for (const id of externalIds) {
        if (idInfo.definedIds.has(id)) {
          elems.push(it);
          break;
        }
      }
    };
    return elems;
  } else {
    return [];
  }
}


function getIdInfo(svg) {
  const definedIds = getDefinedIds(svg);
  const externalIds = new Set();
  const useElements = svg.querySelectorAll('use');
  [].forEach.call(useElements, (it) => {
    const href = getHref(it);
    if (href && href.startsWith('#')) {
      const id = href.substring(1);
      if (!definedIds.has(id)) {
        externalIds.add(id);
      }
    }
  });
  return {definedIds, externalIds}
}

function hasHref(node) {
  return node.hasAttribute('href') || node.hasAttribute('xlink:href');
}

function getHref(node) {
  if (hasHref(node)) {
    return (node.getAttribute('href') || node.getAttribute('xlink:href')).trim();
  } else {
    return null;
  }
}

function getReferencedElem(externalId) {
  const svgs = document.querySelectorAll('svg')
  for (const svg of svgs) {
    const elems = svg.querySelectorAll('[id]');
    for (const elem of elems) {
      const id = (elem.getAttribute('id') || '').trim();
      if (id && id == externalId) {
        return elem;
      }
    };
  }
  return null;
}




function getDefinedIds(svg) {
  const definedIds = new Set();
  const definedElements = svg.querySelectorAll('[id]');
  [].forEach.call(definedElements, (it) => {
    definedIds.add(it.getAttribute('id').trim());
  });
  return definedIds;
}


function getExternalReferencedElems(svg) {
  const definedIds = getDefinedIds(svg);
  const useElements = svg.querySelectorAll('use');

  const elems = [];
  [].forEach.call(useElements, (it) => {
    const href = getHref(it);
    if (href && href.startsWith('#')) {
      const id = href.substring(1);
      if (!definedIds.has(id)) {
        const elem = getReferencedElem(id);
        if (elem) {
          elems.push(elem)
        } else {
          console.debug("Couldn't find referenced elem: ", id);
        }
      }
    }
  });
  return elems;
}


export default {getGlobalDefinedElements,
  hasHref, getHref,
  getDefinedIds, getReferencedElem,
  getExternalReferencedElems,
};
