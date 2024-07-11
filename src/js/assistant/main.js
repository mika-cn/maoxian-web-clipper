"use strict";

import Log       from '../lib/log.js';
import ExtMsg    from '../lib/ext-msg.js';
import MxWcEvent from '../lib/event.js';
import Plan      from './plan.js';

function getPlan() {
  return ExtMsg.sendToBackend('assistant', {
    type: 'get.plan',
    body: {url: window.location.href}
  })
}



// in order to write plan a little bit easier
// we expose the plan's action structure as:
//   {$actionName => $actionValue, [tag]}
// so we need to turn it back before apply it.
function toInternalPlan(plan) {
  const actions = [];
  if (plan.actions) {
    plan.actions.forEach((it) => {
      const keys = Object.keys(it);
      if (0 < keys.length && keys.length < 3) {
        const tag = it.tag;
        let name, args;
        if (keys.length == 1 && !tag) {
          name  = keys[0];
          args  = [it[name]];
        }

        if (keys.length == 2 && tag) {
          name = (keys.indexOf('tag') == 0 ? keys[1] : keys[0]);
          args  = [it[name]];
        }

        if (name) {
          const action = {name, args}
          if (tag) { action.tag = tag }
          actions.push(action);
        }
      }
    });
  }

  if (actions.length > 0) {
    return Object.assign({}, plan, {actions})
  } else {
    return plan;
  }
}


// Other components can call assistant to apply plan,
// such as the remember selection component.
/*
 * @param {Boolean} isTopFrame ~ listen on top frame?
 */
function listenInternalEvent(isTopFrame) {
  const evNameA = 'assistant.apply-plan';
  const evNameB = 'assistant.apply-plan-global';
  const evNameC = 'assistant.apply-plan.top-frame';
  const evNameD = 'assistant.apply-plan-global.top-frame';

  const applyPlanFn = (e) => {
    const plan = MxWcEvent.getData(e);
    Plan.apply(toInternalPlan(plan));
  };

  const applyGlobalPlanFn = (e) => {
    const plan = MxWcEvent.getData(e);
    Plan.applyGlobal(toInternalPlan(plan));
  };

  if (isTopFrame) {
    MxWcEvent.listenInternal(evNameC, applyPlanFn)
    MxWcEvent.listenInternal(evNameD, applyGlobalPlanFn);
  }
  MxWcEvent.listenInternal(evNameA, applyPlanFn)
  MxWcEvent.listenInternal(evNameB, applyGlobalPlanFn);
}


function init() {
  getPlan().then(({globalPlan, pagePlan}) => {
    if (globalPlan) {
      if (globalPlan.disabled) {
        Log.debug("The global plan is disabled");
      } else {
        Plan.applyGlobal(toInternalPlan(globalPlan));
        Log.debug("the global plan has been applied");
      }
    }
    if (pagePlan) {
      if (pagePlan.disabled) {
        Log.debug("The page plan is disabled");
        sendAssistantEv('plan-disabled');
      } else {
        Plan.apply(toInternalPlan(pagePlan));
        Log.debug("the page plan has been applied");
        Log.debug(pagePlan);
      }
    } else {
      Log.debug("No page plan matched");
      sendAssistantEv('not-plan-matched');
    }
  });
}

function sendAssistantEv(name) {
  if (window.parent == window) {
    setTimeout(() => {MxWcEvent.dispatchInternal('assistant.' + name)}, 0);
  }
}


const AssistantMain = {
  init: init,
  listenInternalEvent: listenInternalEvent
}

export default AssistantMain;
