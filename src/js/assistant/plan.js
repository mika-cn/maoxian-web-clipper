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
  MxWcEvent.listenInternal('selecting', performWhenSelecting);
  MxWcEvent.listenInternal('completed', performWhenCompleted);
  MxWcEvent.listenInternal('idle', performWhenIdle);
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
      selectorInput: selectorInput,
      contextSelectorInput: contextSelectorInput,
      perform: function(detail={}) {
        const selectorStrs = T.toArray(this.selectorInput);
        const contextElem = getContextElem(this.contextSelectorInput);
        selectorStrs.forEach(function(it) {
          queryElemsBySelector(it, contextElem)
            .forEach(function(elem) {
              const style = window.getComputedStyle(elem);
              if(style.display != params.display) {
                elem.setAttribute("data-mx-original-display-value", elem.style.getPropertyValue('display'));
                elem.setAttribute("data-mx-original-display-priority", elem.style.getPropertyPriority('display'));
                elem.style.setProperty('display', params.display, params.priority);
              }
            });
        })
      }
    }
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

Action.undoDisplay = function(selectorInput, contextSelectorInput = 'document') {
  return {
    name: 'undoDisplay',
    isPerformOnce: false,
    selectorInput: selectorInput,
    contextSelectorInput: contextSelectorInput,
    perform: function(detail={}) {
      const selectorStrs = T.toArray(this.selectorInput);
      const contextElem = getContextElem(this.contextSelectorInput);
      selectorStrs.forEach(function(it) {
        queryElemsBySelector(it, contextElem)
          .forEach(function(elem) {
            const attrNameOfValue = "data-mx-original-display-value";
            const attrNameOfPriority = "data-mx-original-display-priority";

            if (elem.hasAttribute(attrNameOfValue)) {
              const originalValue = elem.getAttribute(attrNameOfValue);
              const originalPriority = elem.getAttribute(attrNameOfPriority);
              elem.style.setProperty('display', originalValue, originalPriority);
              elem.removeAttribute(attrNameOfValue);
              elem.removeAttribute(attrNameOfPriority);
              if (elem.style.length === 0) {
                elem.removeAttribute('style');
              }
            }
          });
      })
    }
  }
}


/*
 * chAttr {Attay} [$action]
 *
 * Structure of $action {Object}
 *
 * action.type {String} (required) available values are:
 *   0. "assign.from.value"
 *   1. "assign.from.self-attr"
 *   2. "assign.from.parent-attr"
 *   3. "assign.from.ancestor-attr"
 *   4. "assign.from.ancestor.child-attr"
 *
 *   5. "replace.last-match"
 *   6. "replace.all"
 *
 *   7. "split2list.add"
 *   8. "split2list.remove"
 *
 * action.pick {SelectorInput} (required)
 *   Which element to operator.
 *
 * action.attr {String} (required)
 *   Which attribute to operator.
 *
 * action.subStr {String|Array} (required if type is 5 or 6)
 *   The String that is to be replaced by newStr. not interpreted as a regular expression.
 *
 *
 * action.newStr {String} (required if type is 5 or 6)
 *   The String that replaces the substring specified by the subStr parameter.
 *
 * action.tElem {Array} (required if type is 3 or 4)
 *   The CSS selector(s) that will be used to select the target element.
 *   if type is 3 it contains one or two selectors,
 *     the first one is used to select the ancestor,
 *     if the first one is not enough to identify the ancestor,
 *     provide the second one which select the ancestor's children to help the identification.
 *   if type is 4 it should contains two CSS selectors,
 *     the first one is used to select the ancestor,
 *     the second one is used to select the ancestor's children.
 *
 * action.tAttr {String} (required if type is in [1, 2, 3, 4])
 *   The target attribute that will be used as value to assignment.
 *
 * action.sep {String} (required if type is 7 or 8.)
 *   The separator that will be used to split the attribute (action.attr).
 *
 * action.value {String} (required if type is in [0, 7, 8])
 *   The value that will be assigned, added or removed from the list.
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
    contextSelectorInput: contextSelectorInput,
    perform: function(detail={}) {
      const This = this;
      this.actions.forEach(function(action) {
        This.changeAttr(action);
      })
      //console.debug("MxWcTool.changeAttr", document.location.href);
    },

    changeAttr: function(action) {
      const This = this;
      const selectorStrs = T.toArray(action.pick);
      const contextElem = getContextElem(this.contextSelectorInput);
      selectorStrs.forEach(function(it) {
        queryElemsBySelector(it, contextElem)
          .forEach(function(elem) {
            const value = This.getValue(elem, action, contextElem);
            if(value) {
              const attrName = ['data-mx-original-attr', action.attr].join('-');
              let attrOldValue = elem.getAttribute(action.attr);
              attrOldValue = attrOldValue == null ? "" : attrOldValue;
              elem.setAttribute(attrName, attrOldValue);
              elem.setAttribute(action.attr, value);
            }
          });
      })

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

            if (isElemMatchesSelector(ancestor, ancestorSelector)) {
              if (childSelector) {
                // both selector were provided.
                const children = queryElemsByCss(childSelector, ancestor);
                if (children.length > 0) {
                  // both selector can match elements, this is the target.
                  result = ancestor.getAttribute(action.tAttr);
                  return false;
                } else {
                  // the second selector can't match any elements,
                  // this is not the target, keep iterating.
                  return true;
                }
              } else {
                // only ancestorSelector was provided, this is the target.
                result = ancestor.getAttribute(action.tAttr);
                return false;
              }
            } else {
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

            if (isElemMatchesSelector(ancestor, ancestorSelector)) {
              const children = queryElemsByCss(action.tSelector, ancestor);

              // it's the wrong ancestor, keep iterating.
              if (children.length == 0) { return true }

              // Should not select the picked elem, keep iterating.
              if (children[0] == elem) { return true }

              result = children[0].getAttribute(action.tAttr);
              return false;
            }
            return true;
          });
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


        case 'self.add': //deprecated
        case 'self.remove': //deprecated
        case 'split2list.add':
        case 'split2list.remove':
          let parts = [];
          const attrValue = elem.getAttribute(action.attr);
          if(attrValue) {
            parts = attrValue.trim().split(action.sep);
          }
          const idx = parts.indexOf(action.value);
          if((action.type == 'split2list.add' || action.type == 'self.add') && idx == -1) {
            parts.push(action.value);
            return parts.join(action.sep);
          }
          if((action.type == 'split2list.remove' || action.type == 'self.remove') && idx > -1) {
            parts.splice(idx, 1);
            return parts.join(action.sep);
          }
          break;
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
    contextSelectorInput: contextSelectorInput,
    perform: function(detail={}) {
      const contextElem = getContextElem(this.contextSelectorInput);
      this.actions.forEach(function(action) {
        const selectorStrs = T.toArray(action.pick);
        selectorStrs.forEach(function(it) {
          queryElemsBySelector(it, contextElem)
            .forEach(function(elem) {
              const attrName = ['data-mx-original-attr', action.attr].join('-');
              const originalValue = elem.getAttribute(attrName);
              if(originalValue != null) {
                elem.setAttribute(action.attr, originalValue);
                elem.removeAttribute(attrName);
              }
            });
        });
      })
      //console.debug("MxWcTool.undoChangeAttr");
    }
  }
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

Action.setForm = function(inputs) {
  return {
    name: 'setForm',
    isPerformOnce: true,
    inputs: inputs,
    perform: function(detail={}) {
      MxWcEvent.dispatchInternal('set-form-inputs', {
        options: inputs
      });
    }
  }
};

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

function queryFirstElem(selectorInput, contextElem) {
  const selectorStrs = T.toArray(selectorInput);
  let elem = undefined;
  let selector = undefined;
  for(let i = 0; i < selectorStrs.length; i++) {
    const selectorStr = selectorStrs[i];
    const elems = queryElemsBySelector(selectorStr, contextElem);
    const first = elems[0];
    if(first) {
      elem = first;
      selector = Selector.parse(selectorStr);
      break;
    }
  }
  return [elem, selector];
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

function queryElemsByCss(cssSelector, contextElem = document) {
  const elems = [];
  try {
    [].forEach.call(contextElem.querySelectorAll(cssSelector), function(elem) {
      elems.push(elem)
    });
  } catch(e) {
    console.warn("[Mx assistant] invalid selector: ", cssSelector);
    console.warn(e.message);
    console.warn(e);
  }
  return elems;
}

function queryElemsByXpath(xpath, contextElem = document) {
  try {
    const xpathResult = document.evaluate(
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
  const elems = [];
  let elem = xpathResult.iterateNext();
  while(elem){
    elems.push(elem);
    elem = xpathResult.iterateNext();
  }
  return elems;
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

function setFormInputs(inputs) {
  listen('selecting', Action.setForm(inputs));
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
 *   showElem: $SelectorInput,
 *   chAttr: [$action, ...]
 * }
 * Selector: $type||$q
 */
function apply(plan) {
  const {pickElem, pickAction = 'select'} = plan;
  if(isTopWindow() && hasSelector(pickElem)) {
    const selectorInput = pickElem;
    handleNormalAttr(plan, selectorInput);
    switch(pickAction) {
      case 'select':
        listen('selecting', Action.selectElem(selectorInput));
        break;
      case 'confirm':
        listen('selecting', Action.confirmElem(selectorInput));
        break;
      case 'clip':
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
  const {hideElem, hideElemOnce, showElem, chAttr} = plan;
  if(hasSelector(hideElem)) {
    const selectorInput = hideElem;
    listen('selecting', Action.hideElem(selectorInput, contextSelectorInput));
    listen('idle', Action.undoDisplay(selectorInput, contextSelectorInput));
  }

  if(hasSelector(hideElemOnce)) {
    const selectorInput = hideElemOnce;
    listen('selecting', Action.hideElemOnce(selectorInput, contextSelectorInput));
    listen('idle', Action.undoDisplay(selectorInput, contextSelectorInput));
  }

  if(hasSelector(showElem)) {
    const selectorInput = showElem;
    listen('selecting', Action.showElem(selectorInput, contextSelectorInput));
    listen('idle', Action.undoDisplay(selectorInput, contextSelectorInput));
  }

  if(chAttr) {
    listen('selecting', Action.chAttr(chAttr, contextSelectorInput));
    listen('idle', Action.undoChAttr(chAttr, contextSelectorInput));
  }
}

const hasSelector = function(it) { return it && it.length > 0; }

/* initialize */
bindListener();

const PublicApi = {
  apply: apply,
  applyGlobal: applyGlobal,
  setFormInputs: setFormInputs
}

export default PublicApi;
