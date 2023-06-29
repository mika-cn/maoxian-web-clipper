/*!
 * MaoXian Web Clipper Tool
 *   apply function is used to apply a plan. Plan describes some operators include hiding DOM element, picking DOM element etc.
 *   plan: {
 *     hideElem: [Selector, Selector..]
 *     pickElem: [Selector, Selector..]
 *     pickAction: 'select' or 'confirm' or 'clip'
 *   }
 */

"use strict";

import T from '../lib/tool.js';
import MxWcEvent from '../lib/event.js';
import UrlEditor from './url-editor.js';

let listeners = {};

function listen(type, action) {
  const actions = getActions(type);
  actions.push(action);
  listeners[type] = actions;
}

function getActions(type) {
  return listeners[type] || [];
}
//=========================================
// perform && undo
//=========================================


function bindListener() {
  MxWcEvent.listenInternal('actived', performWhenActived);
  MxWcEvent.listenInternal('selecting', performWhenSelecting);
  MxWcEvent.listenInternal('completed', performWhenCompleted);
  MxWcEvent.listenInternal('idle', performWhenIdle);
}

function performWhenActived(e) {
  const detail = {};
  perform('actived', detail);
}

function performWhenSelecting(e) {
  const detail = {};
  perform('selecting', detail);
}

function performWhenCompleted(e) {
  const detail = MxWcEvent.getData(e);
  perform('completed', detail);
}

function performWhenIdle(e) {
  const detail = {};
  perform('idle', detail);
}

function perform(msgType, detail) {
  const r = [];
  const actions = getActions(msgType);
  actions.forEach((action) => {
    action.perform(detail);
    if(action.isPerformOnce) {
      r.push(action);
    }
  });
  r.forEach((action) => {
    const idx = actions.indexOf(action)
    if(idx > -1) {
      actions.splice(idx, 1);
    }
  });
  listeners[msgType] = actions;
}

//=========================================
// Actions
//=========================================

const Action = {};

function createSetDisplayAction(params) {
  return function(selectorInput, contextSelectorInput = 'document') {
    return {
      name: params.name,
      isPerformOnce: (params.performOnce || false),
      perform: function(detail={}) {
        const queryType = (params.queryType || 'elems');
        const Q = createSelectorQuery(contextSelectorInput, queryType);
        const attrNameA = "data-mx-original-display-value";
        const attrNameB = "data-mx-original-display-priority";

        const fn = (elem) => {
          const style = window.getComputedStyle(elem);
          if(style.display != params.display) {
            elem.setAttribute(attrNameA, elem.style.getPropertyValue('display'));
            elem.setAttribute(attrNameB, elem.style.getPropertyPriority('display'));
            elem.style.setProperty('display', params.display, params.priority);
          }
        }
        Q.eachElem(selectorInput, fn);
      },
    };
  }
}

Action.showElem = createSetDisplayAction({
  name: 'showElem',
  display: 'block',
  priority: 'important'
});

Action.hideElem = createSetDisplayAction({
  name: 'hideElem',
  display: 'none',
  priority: 'important'
});

Action.hideElemOnce = createSetDisplayAction({
  name: 'hideElem',
  display: 'none',
  priority: 'important',
  performOnce: true
});

Action.hideSibling = createSetDisplayAction({
  name: 'hideSibling',
  display: 'none',
  priority: 'important',
  queryType: 'siblings',
});

Action.undoHideSibling = createUndoDisplayAction({
  name: 'undoHideSibling',
  performOnce: false,
  queryType: 'siblings',
});

Action.hideExcept = createSetDisplayAction({
  name: 'hideExcept',
  display: 'none',
  priority: 'important',
  queryType: 'reverseQuery',
});


Action.undoHideExcept = createUndoDisplayAction({
  name: 'undoHideExcept',
  performOnce: false,
  queryType: 'reverseQuery',
});

Action.undoDisplay = createUndoDisplayAction({
  name: 'undoDisplay',
  performOnce: false,
});


function createUndoDisplayAction(params) {
  return function(selectorInput, contextSelectorInput = 'document') {
    return {
      name: params.name,
      isPerformOnce: params.performOnce,
      perform: function(detail={}) {
        const queryType = (params.queryType || 'elems');
        const Q = createSelectorQuery(contextSelectorInput, queryType);
        const attrNameA = "data-mx-original-display-value";
        const attrNameB = "data-mx-original-display-priority";

        const fn = (elem) => {
          if (elem.hasAttribute(attrNameA)) {
            const originalValue    = elem.getAttribute(attrNameA);
            const originalPriority = elem.getAttribute(attrNameB);
            elem.style.setProperty('display', originalValue, originalPriority);
            elem.removeAttribute(attrNameA);
            elem.removeAttribute(attrNameB);
            if (elem.style.length === 0) {
              elem.removeAttribute('style');
            }
          }
        };
        Q.eachElem(selectorInput, fn);
      },
    };
  }
}


/*
 * chAttr {Attay} [$action]
 *
 * Structure of $action {Object}
 *
 * action.type {String} (required) available values are:
 *   T01 = "assign.from.value"
 *   T02 = "assign.from.self-attr"
 *
 *   T11 = "assign.from.parent-attr"
 *   T12 = "assign.from.ancestor-attr"
 *   T13 = "assign.from.ancestor.child-attr"
 *
 *   T21 = "assign.from.first-child-attr"
 *   T22 = "assign.from.child-attr"
 *   T23 = "assign.from.descendent-attr"
 *
 *   T51 = "url.file.set-ext-suffix"
 *   T52 = "url.file.rm-ext-suffix"
 *   T53 = "url.file.set-name-suffix"
 *   T54 = "url.file.rm-name-suffix"
 *   T55 = "url.search.edit"
 *
 *   T71 = "replace.last-match"
 *   T72 = "replace.all"
 *
 *   T91 = "split2list.add"
 *   T92 = "split2list.remove"
 *
 *
 * action.pick {SelectorInput} (required)
 *   Which element to operator.
 *
 * action.attr {String} (required)
 *   Which attribute to operator.
 *
 * action.subStr {String|Array} (required if type is T71 or T72)
 *   The String that is to be replaced by newStr. not interpreted as a regular expression.
 *
 *
 * action.newStr {String} (required if type is T71 or T72)
 *   The String that replaces the substring specified by the subStr parameter.
 *
 * action.tElem {Array} (required if type is in [T12, T13, T22, T23])
 *   The CSS selector(s) that will be used to select the target element.
 *   if type is T12, it contains one or two selectors,
 *     the first one is used to select the ancestor,
 *     if the first one is not enough to identify the ancestor,
 *     provide the second one which select the ancestor's children to help the identification.
 *   if type is T13 it should contains two CSS selectors,
 *     the first one is used to select the ancestor,
 *     the second one is used to select the ancestor's children.
 *
 * action.tAttr {String} (required if type is in [T02, T11, T12, T13, T21, T22, T23])
 *   The target attribute that will be used as value to assignment.
 *
 * action.sep {String} (required if type is T91 or T92.)
 *   The separator that will be used to split the attribute (action.attr).
 *
 * action.value {String} (required if type is in [T01, T91, T92])
 *   The value that will be assigned, added or removed from the list.
 *
 *   if type is T91 or T92, it counld be an array.
 *
 */

function initChAttrActions(params) {
  const result = [];
  params.forEach(function(it) {
    if(['split2list.add', 'split2list.remove', 'self.add', 'self.remove'].indexOf(it.type) > -1) {
      if(!it.attr) { it.attr = 'class' }
      if(!it.sep) { it.sep = ' ' }
    }
    result.push(it);
  });
  return result;
}


Action.chAttr = function(params, contextSelectorInput = 'document') {
  const actions = initChAttrActions(params);
  return {
    name: 'chAttr',
    isPerformOnce: false,
    actions: actions,

    perform: function(detail={}) {
      const Q = createSelectorQuery(contextSelectorInput);
      const fn = (action) => this.changeAttr(action, Q);
      this.actions.forEach(fn)
    },

    changeAttr: function(action, Q) {
      const fn = ((elem, contextElem) => {
        const value = this.getValue(elem, action, contextElem);
        if(value !== null && value !== undefined) {
          // has value ('' or other)
          if (!action.attr.startsWith('data-mx-')) {
            // Not a MaoXian attribute
            const attrName = ['data-mx-original-attr', action.attr].join('-');
            if (elem.hasAttribute(attrName)) {
              // Do nothing, avoid overwriting the original attribute.
            } else {
              // Save original attribute
              let attrOldValue = elem.getAttribute(action.attr);
              attrOldValue = attrOldValue == null ? "" : attrOldValue;
              elem.setAttribute(attrName, attrOldValue);
            }
          }
          elem.setAttribute(action.attr, value);
        }
      }).bind(this);
      Q.eachElem(action.pick, fn);
    },


    getValue: function(elem, action, contextElem) {
      switch(action.type) {
        case 'assign.from.value':
          return action.value;
          break;
        case 'self.attr': // deprecated
        case 'assign.from.self-attr':
          return elem.getAttribute(action.tAttr);
          break;


        case 'parent.attr': //deprecated
        case 'assign.from.parent-attr':
          if(elem.parentElement) {
            return elem.parentElement.getAttribute(action.tAttr);
          }
          break;


        case 'assign.from.ancestor-attr': {
          let result = undefined;
          const [ancestorSelector, childSelector] = action.tElem;
          if (!ancestorSelector) { return result }

          iterateAncestors(elem, (ancestor) => {
            // out of scope, stop iterating
            if (ancestor == contextElem) { return false }

            const selectorGroup = [ancestorSelector, childSelector];
            const options = {pick: "self"};
            const r = matchesSelectorGroup(ancestor, selectorGroup, options);
            if (r.matches) {
              result = r.elem.getAttribute(action.tAttr);
              // stop iterating, found the result
              return false;
            } else {
              // keep iterating
              return true;
            }
          });
          return result;
        }


        case 'assign.from.ancestor.child-attr': {
          let result = undefined;
          const [ancestorSelector, childSelector] = action.tElem;
          if (!ancestorSelector || !childSelector) { return result }

          iterateAncestors(elem, (ancestor) => {
            // out of scope, stop iterating
            if (ancestor == contextElem) { return false }

            const selectorGroup = [ancestorSelector, childSelector];
            const options = {pick: "child", childBlacklist: [elem]};
            const r = matchesSelectorGroup(ancestor, selectorGroup, options);
            if (r.matches) {
              result = r.elem.getAttribute(action.tAttr);
              // stop iterating, found the result
              return false;
            } else {
              // keep iterating
              return true;
            }
          });
          return result;
        }

        case 'assign.from.first-child-attr': {
          const children = elem.children;
          if (children && children.length > 0) {
            return children[0].getAttribute(action.tAttr);
          } else {
            return undefined;
          }
        }

        case 'assign.from.child-attr': {
          let result = undefined;
          const [selectorA, selectorB] = action.tElem;
          if (!selectorA) { return result }

          iterateChildren(elem, (child) => {
            const selectorGroup = [selectorA, selectorB];
            const options = {pick: "self"};
            const r = matchesSelectorGroup(child, selectorGroup, options);
            if (r.matches) {
              result = r.elem.getAttribute(action.tAttr);
              // stop iterating, found the result
              return false;
            } else {
              // keep iterating
              return true;
            }
          });

          return result;
        }

        case 'assign.from.descendant-attr': {
          let result = undefined;
          const [selectorA, selectorB] = action.tElem;
          if (!selectorA) { return result }
          const elems = queryElemsByCss(selectorA, elem);
          if (elems.length == 0) { return result }
          if (selectorB) {
            const target = elems.find((it) => queryElemsBySelector(selectorB, it).length > 0);
            if (target) {
              result = target.getAttribute(action.tAttr);
            }
          } else {
            result = elems[0].getAttribute(action.tAttr);
          }
          return result;
        }


        case 'self.replace': //deprecated
        case 'replace.last-match': {
          const attr = elem.getAttribute(action.attr);
          const subStrs = T.toArray(action.subStr);
          const newStrs = T.toArray(action.newStr);

          for (let i = 0; i < subStrs.length; i++) {
            const index = attr.lastIndexOf(subStrs[i])
            if(index > -1) {
              const firstPart = attr.substring(0, index);
              const lastPart = attr.substring(index);
              return [
                firstPart,
                lastPart.replace(subStrs[i], (newStrs[i] || newStrs[0] || ''))
              ].join('');
            }
          }
          break;
        }


        case 'replace.all': {
          try {
            const attr = elem.getAttribute(action.attr);
            const subStrs = T.toArray(action.subStr);
            const newStrs = T.toArray(action.newStr);

            let result = attr, changed = false;
            for (let i = 0; i < subStrs.length; i++) {
              const index = attr.indexOf(subStrs[i])
              if(index > -1) {
                const re = new RegExp(T.escapeRegExp(subStrs[i]),  'mg');
                result = result.replace(re, (newStrs[i] || newStrs[0] || ''));
                changed = true;
              }
            }

            if (changed) { return result }
          } catch(e){ console.warn(e)}
          break;
        }

        case 'url.file.set-ext-suffix':
        case 'url.file.rm-ext-suffix':
        case 'url.file.set-name-suffix':
        case 'url.file.rm-name-suffix': {
          try {
            const attrValue = elem.getAttribute(action.attr);
            if (!attrValue) { break; }
            return UrlEditor.editFile(attrValue, action);
          } catch(e) { console.warn(e)}
          break;
        }

        case 'url.search.edit': {
          try {
            const attrValue = elem.getAttribute(action.attr);
            if (!attrValue) { break; }
            const deleteNames = T.toArray(action.delete);
            return UrlEditor.editSearch(attrValue, action.change, deleteNames);
          } catch(e) { console.warn(e), console.stack()}
          break;
        }
        case 'self.add': //deprecated
        case 'self.remove': //deprecated
        case 'split2list.add':
        case 'split2list.remove': {
          let parts = [];
          const attrValue = elem.getAttribute(action.attr);
          if (attrValue) {
            parts = attrValue.trim().split(action.sep);
          }

          const isAdd = (action.type == 'split2list.add' || action.type == 'self.add');
          const isRm  = (action.type == 'split2list.remove' || action.type == 'self.remove');

          T.toArray(action.value).forEach((it) => {
            const idx = parts.indexOf(it);
            if(isAdd && idx == -1) { parts.push(it) }
            if(isRm  && idx >  -1) { parts.splice(idx, 1) }
          });
          return parts.join(action.sep);
        }
      }
      return undefined;
    }
  }
}


Action.undoChAttr = function(params, contextSelectorInput = 'document') {
  const actions = initChAttrActions(params);
  return {
    name: 'undoChAttr',
    isPerformOnce: false,
    actions: actions,

    perform(detail={}) {
      const Q = createSelectorQuery(contextSelectorInput);
      const fn = (action) => this.undo(action, Q);
      this.actions.forEach(fn)
    },

    undo(action, Q) {
      const fn = (elem) => {
        if (action.attr.startsWith('data-mx-')) {
          // maoxian attribute, remove it
          elem.removeAttribute(action.attr);
        } else {
          // not a maoxian attribute, restore old value
          const attrName = ['data-mx-original-attr', action.attr].join('-');
          const originalValue = elem.getAttribute(attrName);
          if(originalValue != null) {
            elem.setAttribute(action.attr, originalValue);
            elem.removeAttribute(attrName);
          }
        }
      }
      Q.eachElem(action.pick, fn);
    }
  }
}


Action.rmAttr = function(params, contextSelectorInput = 'document') {
  return {
    name: 'rmAttr',
    isPerformOnce: false,
    actions: params,
    perform: function(detail={}) {
      const Q = createSelectorQuery(contextSelectorInput)
      const fn = (action) => this.rmAttr(action, Q);
      this.actions.forEach(fn);
    },
    rmAttr(action, Q) {
      const fn = elem => {
        T.toArray(action.attr).forEach((attrName) => {
          if (attrName) { // attrName isn't empty
            const attrValue = elem.getAttribute(attrName);
            if (attrValue !== null && attrValue !== undefined) {
              const key = "data-mx-removed-attr-" + attrName
              elem.setAttribute(key, attrValue);
              elem.removeAttribute(attrName);
            }
          }
        });
      }
      Q.eachElem(action.pick, fn);
    }
  }
}


Action.undoRmAttr = function(params, contextSelectorInput = 'document') {
  return {
    name: 'undoRmAttr',
    isPerformOnce: false,
    actions: params,
    perform: function(detail={}) {
      const Q = createSelectorQuery(contextSelectorInput)
      const fn = (action) => this.undo(action, Q);
      this.actions.forEach(fn);
    },
    undo(action, Q) {
      const fn = (elem) => {
        T.toArray(action.attr).forEach((attrName) => {
          if (attrName) {
            const key = "data-mx-removed-attr-" + attrName
            if (elem.hasAttribute(key)) {
              const attrValue = elem.getAttribute(key);
              elem.setAttribute(attrName, attrValue);
              elem.removeAttribute(key);
            }
          }
        });
      }
      Q.eachElem(action.pick, fn);
    }
  }
}

Action.command = function(commands, contextSelectorInput = 'document') {
  return {
    name: 'command',
    isPerformOnce: false,
    commands: commands,
    perform: function(detail={}) {
      const Q = createSelectorQuery(contextSelectorInput)
      const fn = (command) => this.execute(command, Q);
      this.commands.forEach(fn);
    },

    execute(command, Q) {
      switch(command.name) {
        case 'click': {
          const fn = (elem) => {if (elem.click) {elem.click()}};
          Q.eachElem(command.pick, fn);
          break;
        }
        case 'open':
        case 'close': {
          const v = ({'open': true, 'close': false})[command.name];
          const fn = (elem) => {
            if (elem.open !== v) {
              elem.setAttribute('data-mx-property-open', elem.open);
              elem.open = v;
            }
          }
          Q.eachElem(command.pick, fn);
          break;
        }
      }
    },

  };
}

Action.undoCommand = function(commands, contextSelectorInput = 'document') {
  return {
    name: 'undoCommand',
    isPerformOnce: false,
    commands: commands,
    perform: function(detail={}) {
      const Q = createSelectorQuery(contextSelectorInput)
      const fn = (command) => this.undo(command, Q);
      this.commands.forEach(fn);
    },

    undo(command, Q) {
      switch(command.name) {
        case 'click': break;
        case 'open':
        case 'close': {
          const fn = (elem) => {
            const originalValue = (elem.getAttribute('data-mx-property-open'))
            if (originalValue != null && originalValue != undefined) {
              const oldValue = ('true' == originalValue);
              if (elem.open !== oldValue) {
                elem.open = oldValue;
              }
            }
          }
          Q.eachElem(command.pick, fn);
          break;
        }
      }
    }
  };
}



function createPickedElemAction(params) {
  return function(selectorInput) {
    return {
      name: params.name,
      isPerformOnce: true,
      selectorInput: selectorInput,
      perform: function(detail = {}) {
        const [elem, selector] = queryFirstElem(this.selectorInput, document);
        if(elem) {
          const msg = {
            qType: Selector.getTypeName(selector),
            q: selector.q
          };
          if(params.options) {
            msg.options = params.options
          }
          MxWcEvent.dispatchInternal(params.eventName, msg);
        } else {
          console.warn("[MxAssistant]", "Can't find Elem to pick, selectorInput: ", this.selectorInput);
        }
      }
    }
  }
}

Action.selectElem = createPickedElemAction({
  name: 'selectElem',
  eventName: 'select-elem'
});

Action.confirmElem = createPickedElemAction({
  name: 'confirmElem',
  eventName: 'confirm-elem',
  options: {}
});

Action.clipElem = createPickedElemAction({
  name: 'clipElem',
  eventName: 'clip-elem',
  options: {}
});

/*
 * @param {Object} form
 *   - {String} [format]
 *   - {SelectorInput} [title]
 *   - {String} [category]
 *   - {String} [tagstr]
 */
Action.setForm = function(form = {}) {
  return {
    name: 'setForm',
    isPerformOnce: true,
    form: form,
    perform: function(detail={}) {
      const selectorInput = this.form.title;
      const inputs = T.sliceObj(this.form, ['format', 'category', 'tagstr']);
      const change = {};
      if (selectorInput) {
        const [elem, selector] = queryFirstElem(selectorInput, document);
        if(elem) {change.title = elem.textContent.trim()}
      }
      MxWcEvent.dispatchInternal('set-form-inputs', {
        formInputs: Object.assign({}, inputs, change)
      });
    }
  }
};


Action.setConfig = function(config) {
  return {
    name: 'setConfig',
    isPerformOnce: true,
    config: config,
    perform: function(detail={}) {
      MxWcEvent.dispatchInternal('overwrite-config', {
        config: config
      });
    }
  }
}

Action.completed = function(fn) {
  return {
    name: 'completed',
    isPerformOnce: true,
    fn: fn,
    perform: function(detail={}) {
      fn(detail);
    }
  }
}

//=========================================
// Tool functions
//=========================================

function createSelectorQuery(contextSelectorInput,  queryType = 'elems') {
  return {
    _getContextElems() {
      if (!this.contextElems) {
        if (queryType == 'reverseQuery') {
          this.contextElems = getContextElems(contextSelectorInput);
        } else {
          this.contextElems = [getContextElem(contextSelectorInput)];
        }
      }
    },

    eachElem(selectorInput, callback) {
      this._getContextElems();

      if (!this.queryFn) {
        switch(queryType) {
          case 'elems':
            this.queryFn = createQueryEachSelectorFn(queryElemsBySelector);
            break;
          case 'siblings':
            this.queryFn = createQueryEachSelectorFn(querySiblingsBySelector);
            break;
          case 'reverseQuery':
            this.queryFn = querySelectorsReversed;
            break;
          default: break;
        }
      }

      const {contextElems, queryFn} = this;
      if (queryFn) {
        const selectorStrs = T.toArray(selectorInput);
        contextElems.forEach((contextElem) => {
          queryFn(selectorStrs, contextElem).forEach((elem) => {
            callback(elem, contextElem);
          });
        });
      } else {
        console.warn('unknow queryType : ', queryType);
      }
    }
  };
}


function querySelectorsReversed(selectorStrs, contextElem) {
  const foundElems = new Set();
  const ancestorElems = new Set([contextElem]);
  const queryFn = createQueryEachSelectorFn(queryElemsBySelector);
  const continueIterate = true, stopIterate = false;
  queryFn(selectorStrs, contextElem).forEach((it) => {
    foundElems.add(it);
    iterateAncestors(it, (ancestorElem) => {
      if (ancestorElem == contextElem) {
        return stopIterate;
      } else {
        ancestorElems.add(ancestorElem);
        return continueIterate;
      }
    });
  });

  const result = [];
  iterateDescendents(contextElem, (it) => {
    if (foundElems.has(it)) {
      // The found elements' descendents are all
      // treated as found elements.
      return stopIterate;
    }

    if (ancestorElems.has(it)) {
      // Current element is an ancestor of found element.
      // it's descendents might have elements that not
      // belongs to foundElems.
      return continueIterate;
    } else {
      result.push(it);
      return stopIterate;
    }

  });

  return result;
}


function createQueryEachSelectorFn(queryElemsFn) {
  return function(selectorStrs, contextElem) {
    const elems = [];
    selectorStrs.forEach((it) => {
      queryElemsFn(it, contextElem).forEach((elem) => {
        elems.push(elem);
      });
    });
    return elems;
  }
}


function iterateChildren(elem, action) {
  for (const child of elem.children) {
    const continueIterate = action(child);
    if (!continueIterate) { break }
  }
}

function iterateDescendents(elem, action) {
  const queue = [];
  queue.push(elem);

  let currElem;
  while(currElem = queue.shift()) {
    const continueIterate = action(currElem);
    if (continueIterate) {
      for (const child of currElem.children) {
        queue.push(child);
      }
    } else {
      // do nothing
    }
  }
}



function iterateAncestors(elem, action) {
  let currElem = elem;
  let pElem;
  while(true) {
    pElem = currElem.parentElement;
    if (!pElem) { break }
    const continueIterate = action(pElem);
    if (continueIterate) {
      currElem = pElem;
    } else {
      break;
    }
  }
}



/**
 *
 * @param {Array} selectorGroup - one or two selector.
 * @param {Object} options
 * @param {String} options.pick - "self" or "child"
 * @param {[Element]} options.childBlacklist
 *
 * @returns {Object} result
 *        - {boolean} result.matches
 *        - {Element|undefined} result.elem
 */
function matchesSelectorGroup(elem, selectorGroup, options = {}) {
  const [selfSelector, childSelector] = selectorGroup;
  const {pick = "self", childBlacklist = []} = options;
  const result = {matches: false, elem: undefined};
  if (!selfSelector) { return result }
  if (pick == "child" && !childSelector) { return result }
  if (!isElemMatchesSelector(elem, selfSelector)) {
    // selfSelector not matches
    return result;
  }

  // -- selfSelector matches --
  if (!childSelector) {
    // in this case, pick is "self" and
    // only the selfSelector was provided.
    result.matches = true;
    result.elem = elem;
    return result;
  }

  // -- childSelector exists --

  const children = queryElemsByCss(childSelector, elem);
  if (children.length == 0) {
    // childSelector can't matches
    return result;
  }

  const firstChild = children[0];
  if ( childBlacklist
    && childBlacklist.length > 0
    && childBlacklist.indexOf(firstChild) > -1) {
    // on black list
    return result;
  }

  // -- childSelector matches --
  result.matches = true;
  result.elem = (pick == "self" ? elem : firstChild);
  return result;
}


function isElemMatchesSelector(elem, selector) {
  try {
    if (elem.matches) {
      return elem.matches(selector)
    } else {
      // shadowRoot doesn't have matches()
      return false;
    }
  } catch(e) {
    console.warn("[Mx assistant] invalid selector: ", selector);
    console.warn(e.message);
    console.warn(e);
    return false;
  }
}

//======== query element relative ========

function getContextElem(selectorInput) {
  if (selectorInput === 'document') {
    return document;
  } else {
    const [elem, selector] = queryFirstElem(selectorInput, document);
    return elem;
  }
}

function getContextElems(selectorInput) {
  if (selectorInput === 'document') {
    return [document];
  } else {
    return queryAllElems(selectorInput, document);
  }
}


function queryFirstElem(selectorInput, contextElem) {
  let elem = undefined;
  let selector = undefined;
  const continueIterate = true, stopIterate = false;
  iterateSelectorInput(selectorInput, contextElem, (elems, currentSelector) => {
    if(elems && elems[0]) {
      elem = elems[0];
      selector = currentSelector;
      return stopIterate;
    } else {
      return continueIterate;
    }
  });
  return [elem, selector];
}

function queryAllElems(selectorInput, contextElem) {
  const result = new Set();
  iterateSelectorInput(selectorInput, contextElem, (elems) => {
    elems.forEach((elem) => result.add(elem));
  });
  return Array.from(result);
}


function iterateSelectorInput(selectorInput, contextElem, action) {
  const selectorStrs = T.toArray(selectorInput);
  for(let i = 0; i < selectorStrs.length; i++) {
    const selectorStr = selectorStrs[i];
    const elems = queryElemsBySelector(selectorStr, contextElem);
    const selector = Selector.parse(selectorStr);
    const isContinue = action(elems, selector);
    if (!isContinue) { break }
  }
}




function queryElemsBySelector(selectorStr, contextElem) {
  const selector = Selector.parse(selectorStr);
  if(selector) {
    if(selector.type === 'C') {
      return queryElemsByCss(selector.q, contextElem);
    } else {
      return queryElemsByXpath(selector.q, contextElem);
    }
  } else {
    return [];
  }
}

function querySiblingsBySelector(selectorStr, contextElem) {
  const selector = Selector.parse(selectorStr);
  if(selector) {
    if(selector.type === 'C') {
      return querySiblingsByCss(selector.q, contextElem);
    } else {
      return querySiblingsByXpath(selector.q, contextElem);
    }
  } else {
    return [];
  }
}


// ---------- query by CSS ------------


function queryElemsByCss(cssSelector, contextElem = document) {
  const elems = [];
  iterateElemsByCss(contextElem, cssSelector, (elem) => elems.push(elem));
  return elems;
}


function querySiblingsByCss(cssSelector, contextElem = document) {
  const siblings = new Set();
  iterateElemsByCss(contextElem, cssSelector, (elem) => {
    if (elem.parentElement) {
      [].forEach.call(elem.parentElement.children, function(child) {
        if (child !== elem) {
          siblings.add(child);
        }
      });
    }
  });
  return Array.from(siblings);
}


function iterateElemsByCss(contextElem, cssSelector, fn) {
  try {
    [].forEach.call(contextElem.querySelectorAll(cssSelector), fn);
  } catch(e) {
    console.warn("[Mx assistant] invalid selector: ", cssSelector);
    console.warn(e.message);
    console.warn(e);
  }
}


// ---------- query by Xpath ------------


function queryElemsByXpath(xpath, contextElem = document) {
  const elems = [];
  iterateElemsByXpath(contextElem, xpath, (elem) => elems.push(elem));
  return elems;
}


function querySiblingsByXpath(xpath, contextElem = document) {
  const siblings = new Set();
  iterateElemsByXpath(contextElem, xpath, (elem) => {
    if (elem.parentElement) {
      [].forEach.call(elem.parentElement.children, function(child) {
        if (child !== elem) {
          siblings.add(child);
        }
      });
    }
  });
  return Array.from(siblings);
}

function iterateElemsByXpath(contextElem, xpath, fn) {
  let xpathResult;
  try {
    xpathResult = document.evaluate(
      xpath,
      contextElem,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null
    )
  } catch(e) {
    console.warn("[MX assistant] invalid xpath: ", xpath);
    console.warn(e.message);
    console.warn(e);
    return [];
  }

  let elem = xpathResult.iterateNext();
  while(elem){
    fn(elem);
    elem = xpathResult.iterateNext();
  }
}



/*
 * Selector $type||$q
 *   $type => C(css selector) or X(xpath)
 *   $q    => css selector Or Xpath
 */
const Selector = {
  parse: function(input) {
    const SEPARATOR = '||';
    const selector = input.trim();
    const r = selector.split(SEPARATOR);
    switch(r.length) {
      case 1: return {type: 'C', q: r[0]};
      case 2: return {type: r[0], q: r[1]};
      default:
        console.error("Invalid Selector: " + selector);
        return undefined;
    }
  },
  getTypeName: function(selector) {
    return selector.type === 'C' ? 'css' : 'xPath';
  }
}

function onClipCompleted(callback) {
  listen('completed', Action.completed(callback));
}

function isTopWindow() {
  return window.parent == window;
}

/*
 * plan{
 *   pickElem: $SelectorInput,
 *   pickAction: 'select' or 'confirm', or 'clip'
 *   hideElem: $SelectorInput,
 *   hideElemOnce: $SelectorInput,
 *   hideSibling: $SelectorInput,
 *   showElem: $SelectorInput,
 *   chAttr: [$action, ...]
 * }
 * Selector: $type||$q
 */
function apply(plan) {
  const {pickElem, pickAction = 'select'} = plan;
  if(isTopWindow() && hasSelector(pickElem)) {
    const selectorInput = pickElem;
    handleNormalAttr(plan, 'document');
    switch(pickAction) {
      case 'select':
        listen('selecting', Action.selectElem(selectorInput));
        break;
      case 'confirm':
        listen('selecting', Action.confirmElem(selectorInput));
        break;
      case 'clip':
        // Do we really need this?
        break;
      default: break;
    }
  } else {
    applyGlobal(plan);
  }
}

/*
 * plan apply to whole document, not in selected element anymore
 * This could be used in iframe.
 * "pickElem" and "pickAction" attribute will be ignored.
 */
function applyGlobal(plan) {
  handleNormalAttr(plan, 'document');
}

function handleNormalAttr(plan, contextSelectorInput) {
  const {command, hideElem, hideElemOnce, hideSibling, hideExcept, showElem,
    chAttr, rmAttr, setForm, setConfig} = plan;

  if (command) {
    listen('selecting', Action.command(command, contextSelectorInput));
    listen('idle', Action.undoCommand(command, contextSelectorInput));
  }

  if (hasSelector(hideElem)) {
    const selectorInput = hideElem;
    listen('selecting', Action.hideElem(selectorInput, contextSelectorInput));
    listen('idle', Action.undoDisplay(selectorInput, contextSelectorInput));
  }

  if (hasSelector(hideElemOnce)) {
    const selectorInput = hideElemOnce;
    listen('selecting', Action.hideElemOnce(selectorInput, contextSelectorInput));
    listen('idle', Action.undoDisplay(selectorInput, contextSelectorInput));
  }

  if (hasSelector(hideSibling)) {
    const selectorInput = hideSibling;
    listen('selecting', Action.hideSibling(selectorInput, contextSelectorInput));
    listen('idle', Action.undoHideSibling(selectorInput, contextSelectorInput));
  }

  if (hideExcept) {
    const items = T.toArray(hideExcept);
    items.forEach((it) => {
      if (it.inside && it.except) {
        listen('selecting', Action.hideExcept(it.except, it.inside));
        listen('idle', Action.undoHideExcept(it.except, it.inside));
      }
    });
  }

  if (hasSelector(showElem)) {
    const selectorInput = showElem;
    listen('selecting', Action.showElem(selectorInput, contextSelectorInput));
    listen('idle', Action.undoDisplay(selectorInput, contextSelectorInput));
  }

  if (chAttr) {
    listen('selecting', Action.chAttr(chAttr, contextSelectorInput));
    listen('idle', Action.undoChAttr(chAttr, contextSelectorInput));
  }

  if (rmAttr) {
    listen('selecting', Action.rmAttr(rmAttr, contextSelectorInput));
    listen('idle', Action.undoRmAttr(rmAttr, contextSelectorInput));
  }

  if (isTopWindow() && setForm) {
    listen('actived', Action.setForm(setForm));
  }

  if (isTopWindow() && setConfig) {
    listen('actived', Action.setConfig(setConfig));
  }

}

const hasSelector = function(it) { return it && it.length > 0; }

/* initialize */
bindListener();

const PublicApi = {apply, applyGlobal}

export default PublicApi;
