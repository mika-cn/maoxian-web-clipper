"use strict";

import Log       from '../lib/log.js';
import ExtMsg    from '../lib/ext-msg.js';
import MxWcEvent from '../lib/event.js';
import Plan      from './plan.js';

const config = {
  hideElem: true,
  showElem: true,
  changeAttr: true,

  // 'select' 'confirm' or 'clip'
  pickAction: 'select',

  // These actions will apply to whole document
  hideAllFormElement: true,

  // If our guess failed, try to detect main content.
  detectMainContent: false,
}

function getPlan() {
  return ExtMsg.sendToBackend('assistant', {
    type: 'get.plan',
    body: {url: window.location.href}
  })
}

function toMxPlan(plan) {
  const p = {}
  if(plan.pick) {
    p.pickElem = plan.pick;
    p.pickAction = (plan.pickAction || config.pickAction);
  }
  if(config.hideElem && plan.hide) { p.hideElem = plan.hide }
  if(config.hideElem && plan.hideOnce) { p.hideElemOnce = plan.hideOnce }
  if(config.showElem && plan.show) { p.showElem = plan.show }
  if(config.changeAttr && plan.chAttr) { p.chAttr = plan.chAttr }
  return p;
}

// Other components can call assistant to apply plan,
// such as the remember selection component.
function listenInternalEvent() {
  MxWcEvent.listenInternal('assistant.apply-plan', (e) => {
    const plan = MxWcEvent.getData(e);
    Plan.apply(toMxPlan(plan));
  });
  MxWcEvent.listenInternal('assistant.apply-plan-global', (e) => {
    const plan = MxWcEvent.getData(e);
    Plan.applyGlobal(toMxPlan(plan));
  });
}

function init() {
  getPlan().then(({globalPlan, pagePlan}) => {
    if (globalPlan) {
      if (globalPlan.disabled) {
        Log.debug("The global plan is disabled");
      } else {
        Plan.applyGlobal(toMxPlan(globalPlan));
        Log.debug("the global plan has been applied");
      }
    }
    if (pagePlan) {
      if (pagePlan.disabled) {
        Log.debug("The page plan is disabled");
      } else {
        Plan.apply(toMxPlan(pagePlan));
        Log.debug("the page plan has been applied");
      }
    } else {
      Log.debug("No page plan matched");
      setTimeout(() => {
        MxWcEvent.dispatchInternal('assistant.not-plan-matched');
      }, 0);
    }
  });
}

const AssistantMain = {
  init: init,
  listenInternalEvent: listenInternalEvent
}

export default AssistantMain;
