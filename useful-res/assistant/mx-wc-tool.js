;
/*!
 * MaoXian Web Clipper Tool
 *   apply function is used to apply a plan. Plan describes some operators include hiding DOM element, picking DOM element etc.
 *   plan: {
 *     hideElem: [Selector, Selector..]
 *     pickElem: [Selector, Selector..]
 *     pickAction: 'focus' or 'confirm' or 'clip'
 *   }
 */

//=META version 0.2.0

var MxWc = (function(undefined){
  "use strict";
  let ready = false;
  let listeners = {};

  function listen(type, action) {
    const actions = getActions(type);
    actions.push(action);
    listeners[type] = actions;
    if(type == 'ready' && ready == true) {
      // MxWc is ready before we listen
      performWhenReady();
    }
  }

  function getActions(type) {
    return listeners[type] || [];
  }
  //=========================================
  // perform && undo
  //=========================================


  function bindListener() {
    document.addEventListener('mx-wc.ready', performWhenReady);
    document.addEventListener('mx-wc.selecting', performWhenSelecting);
    document.addEventListener('mx-wc.completed', performWhenCompleted);
    document.addEventListener('mx-wc.idle', performWhenIdle);
  }

  function unbindListener() {
    document.removeEventListener('mx-wc.ready', performWhenReady);
    document.removeEventListener('mx-wc.selecting', performWhenSelecting);
    document.removeEventListener('mx-wc.completed', performWhenCompleted);
    document.removeEventListener('mx-wc.idle', performWhenIdle);
  }

  function performWhenReady(e) {
    const detail = {};
    perform('ready', detail);
  }

  function performWhenSelecting(e) {
    const detail = {};
    perform('selecting', detail);
  }

  function performWhenCompleted(e) {
    const detail = JSON.parse(e.detail);
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
  Action.hideElem = function(selectorStrs, contentNode) {
    return {
      name: 'hideElem',
      isPerformOnce: false,
      selectorStrs: selectorStrs,
      contentNode: contentNode,
      perform: function(detail={}) {
        const This = this;
        this.selectorStrs.forEach(function(it) {
          queryElemsBySelector(it, (This.contentNode || document))
            .forEach(function(elem) {
              const style = window.getComputedStyle(elem);
              elem.setAttribute("mx-original-display", style.display);
              elem.style.display = 'none';
            });
        })
      }
    }
  }

  Action.showElem = function(selectorStrs, contentNode) {
    return {
      name: 'showElem',
      isPerformOnce: false,
      selectorStrs: selectorStrs,
      contentNode: contentNode,
      perform: function(detail={}) {
        const This = this;
        this.selectorStrs.forEach(function(it) {
          queryElemsBySelector(it, (This.contentNode || document))
            .forEach(function(elem) {
              const attrName = "mx-original-display";
              const originalDisplay = elem.getAttribute(attrName);
              if(originalDisplay) {
                elem.style.display = originalDisplay;
                elem.removeAttribute(attrName);
              }
            });
        })
      }
    }
  }

  function createPickedElemAction(params) {
    return function(selectorStrs) {
      return {
        name: params.name,
        isPerformOnce: true,
        selectorStrs: selectorStrs,
        perform: function(detail = {}) {
          const [elem, selector] = queryFirstElem(this.selectorStrs, document);
          if(elem) {
            const msg = {
              qType: Selector.getTypeName(selector),
              q: selector.q
            };
            if(params.options) {
              msg.options = params.options
            }
            dispatchEvent(params.eventName, msg);
          }
        }
      }
    }
  }

  Action.focusElem = createPickedElemAction({
    name: 'focusElem',
    eventName: 'mx-wc.focus-elem'
  });

  Action.confirmElem = createPickedElemAction({
    name: 'confirmElem',
    eventName: 'mx-wc.confirm-elem',
    options: {}
  });

  Action.clipElem = createPickedElemAction({
    name: 'clipElem',
    eventName: 'mx-wc.clip-elem',
    options: {}
  });

  Action.setForm = function(inputs) {
    return {
      name: 'setForm',
      isPerformOnce: true,
      inputs: inputs,
      perform: function(detail={}) {
        dispatchEvent('mx-wc.set-form-inputs', {
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

  Action.init = function() {
    return {
      name: 'init',
      isPerformOnce: true,
      perform: function(detail={}) {
        ready = true;
      }
    }
  }

  function dispatchEvent(name, detail){
    const detailJson = JSON.stringify(detail)
    const ev = new CustomEvent(name, {detail: detailJson});
    console.debug('emitEvent', name, detail);
    document.dispatchEvent(ev);
  }

  //=========================================
  // query element relative
  //=========================================

  function queryFirstElem(selectorStrs, contentNode) {
    let elem = undefined;
    let selector = undefined;
    for(let i = 0; i < selectorStrs.length; i++) {
      const selectorStr = selectorStrs[i];
      const elems = queryElemsBySelector(selectorStr, contentNode);
      const first = elems[0];
      if(first) {
        elem = first;
        selector = Selector.parse(selectorStr);
        break;
      }
    }
    return [elem, selector];
  }

  function queryElemsBySelector(selectorStr, contentNode) {
    const selector = Selector.parse(selectorStr);
    if(selector) {
      if(selector.type === 'C') {
        return queryElemsByCss(selector.q, contentNode);
      } else {
        return queryElemsByXpath(selector.q, contentNode);
      }
    } else {
      return [];
    }
  }

  function queryElemsByCss(cssSelector, contentNode = document) {
    const elems = [];
    [].forEach.call(contentNode.querySelectorAll(cssSelector), function(elem) {
      elems.push(elem)
    });
    return elems;
  }

  function queryElemsByXpath(xpath, contentNode = document) {
    const xpathResult = document.evaluate(
      xpath,
      contentNode,
      null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE,
      null
    )
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
        case 2: return {type: q[0], q: r[1]};
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
   *   hideElem: [Selector, Selector..],
   *   pickElem: [Selector, Selector..],
   *   pickAction: 'focus' or 'confirm', or 'clip'
   * }
   * Selector: $type||$q
   */
  function apply(plan) {
    const {hideElem, pickElem, pickAction = 'focus'} = plan;
    const hasSelector = (it) => { return it && it.length > 0; }
    if(isTopWindow()) {
      if(hasSelector(pickElem)) {
        const selectors = pickElem;
        const [pickedElem, selector] = queryFirstElem(selectors, document)
        if(pickedElem) {

          if(hasSelector(hideElem)) {
            listen('selecting', Action.hideElem(hideElem, pickedElem));
            listen('idle', Action.showElem(hideElem, pickedElem));
          }

          switch(pickAction) {
            case 'clip'    : listen('ready', Action.clipElem(selectors)); break;
            case 'confirm' : listen('selecting', Action.confirmElem(selectors)); break;
            case 'focus'   : listen('selecting', Action.focusElem(selectors)); break;
          }
        } else {
          // plan invalid, do nothing
        }
      } else {
        // plan invalid, do nothing
      }
    } else {
      // execute in frame/iframe
      if(hasSelector(hideElem)) {
        listen('selecting', Action.hideElem(pickedElem));
        listen('idle', Action.showElem(pickedElem));
      }
    }
  }

  /* initialize */
  listen('ready', Action.init());
  bindListener();
  console.log('MxWcTool initialized..');

  const PublicApi = {
    apply: apply,
    setFormInputs: setFormInputs,
    onClipCompleted: onClipCompleted
  }

  return PublicApi;
})();
