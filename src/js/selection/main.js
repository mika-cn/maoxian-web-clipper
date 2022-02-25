"use strict";

import T         from '../lib/tool.js';
import Log       from '../lib/log.js';
import ExtMsg    from '../lib/ext-msg.js';
import MxWcEvent from '../lib/event.js';

import {getCssSelector} from 'css-selector-generator';

const state = {appliedSelection: null};

function save(elem) {
  try {
    const selector = getCssSelector(elem);
    if ( state.appliedSelection
      && state.appliedSelection.selector == selector
    ) {
      // Applied selection was accepted.
      // Do nothing
    } else {
      const selection = {
        tagName: elem.tagName.toUpperCase(),
        selector: selector,
        ancestors: getAncestors(elem),
      }
      Log.debug(selection);
      ExtMsg.sendToBackend('selection', {
        type: 'save',
        body: {
          host: window.location.host,
          path: window.location.pathname,
          selection: selection
        }
      });
    }
  } catch (e) {
    // save selection should not influence other function
    Log.error(e);
    console.trace();
  }
}

function apply() {
  try {
    ExtMsg.sendToBackend('selection', {
      type: 'query',
      body: {
        host: window.location.host,
        path: window.location.pathname
      }
    }).then((selections) => {
      Log.debug(selections);
      const selection = chooseSelection(selections);
      if (selection) {
        applySelection(selection);
        state.appliedSelection = selection;
      }
    })
  } catch (e) {
    // apply selection should not influence other function
    Log.error(e);
  }
}

function chooseSelection(selections) {
  const candidates = [];
  selections.forEach((selection) => {
    let targets = [];
    try {
      targets = window.document.querySelectorAll(selection.selector);
    } catch(e) {
      // if selector is invalid.
    }
    if ( targets.length === 1
      && targets[0].tagName.toUpperCase() === selection.tagName
    ) {
      candidates.push({target: targets[0], selection: selection});
    }
  });

  if (candidates.length == 0) {return null;}

  if (candidates.length == 1) {
    return candidates[0].selection;
  } else {
    for (let i = 0; i < candidates.length; i++) {
      const it = candidates[i];
      const targetAncestors = getAncestors(it.target);
      if (twoGroupsOfAncestorAreAlike(it.selection.ancestors, targetAncestors)) {
        return it.selection;
      }
    }

    const sortedCandidates = candidates.sort((a, b) => {
      return a.selection.ancestors.length < b.selection.ancestors.length;
    });
    return sortedCandidates[0].selection;
  }
}

function applySelection(selection) {
  MxWcEvent.dispatchInternal('assistant.apply-plan', {
    pick: selection.selector
  });
}

function twoGroupsOfAncestorAreAlike(ancestorsA, ancestorsB) {
  if (ancestorsA.length == ancestorsB.length) {
    const length = ancestorsA.length;
    let countOfTagNameAlike = 0, countOfRestAlike = 0;

    ancestorsA.forEach((a, index) => {
      const b = ancestorsB[index];

      if (a === b) {
        countOfTagNameAlike++;
        countOfRestAlike++;
      } else {
        const partsA = a.split(/[#\.]{1}/);
        const partsB = b.split(/[#\.]{1}/);
        const tagNameA = partsA.shift();
        const tagNameB = partsB.shift();
        if (tagNameA === tagNameB) { countOfTagNameAlike++; }
        if (partsA.toString() == partsB.toString()) {
          countOfRestAlike++;
        }
      }
    })

    return countOfTagNameAlike == length && length - countOfRestAlike < 2;
  } else {
    return false
  }
}



function getAncestors(node) {
  let currNode = node.parentElement;
  const ancestors = [];
  while (currNode) {
    ancestors.unshift(node2Str(currNode));
    currNode = currNode.parentElement;
  }
  return ancestors;
}

function node2Str(node) {
  const arr = [];
  arr.push(node.tagName.toLowerCase());
  const id = node.getAttribute('id');
  if (id != null && id != '' && !id.match(/^\s+$/) && !id.match(/\d+$/)) {
    const sanitized_id = T.sanitizeSelectorItem(id);
    arr.push(sanitized_id);
    return arr.join('#');
  }

  const blackList = [
    'selected',
    'active', 'actived',
    'disable', 'disabled',
    'enabled', 'enabled',
    'show', 'hide',
    'clearfix',
  ];
  const klass = node.getAttribute('class');
  if (klass) {
    const klasses = [];
    klass.trim().split(/\s+/).forEach((it) => {
      if (it.match(/\d+$/) || it === '') {
        // ends with number
      } else if (it.match(/^[,\.:\*"']/)) {
        // invalid klass
      } else if (blackList.indexOf(it) > -1) {
        // in blacklist
      } else {
        klasses.push(T.sanitizeSelectorItem(it));
      }
    });
    arr.push(...klasses.sort());
  }
  return arr.join('.');
}

function init(config) {
  if (config.rememberSelection) {
    // listen message
    if (config.assistantEnabled) {
      const fn = () => {
        apply();
        Log.debug("MxWcSelectionInited (assistant)");
      }
      MxWcEvent.listenInternal('assistant.not-plan-matched', fn);
      MxWcEvent.listenInternal('assistant.plan-disabled', fn);
      MxWcEvent.listenInternal('assistant.plan-has-not-pick', fn);
    } else {
      apply();
      Log.debug("MxWcSelectionInited");
    }
  }
}

const SelectionMain = {
  init: init,
  save: save,
}

export default SelectionMain;
