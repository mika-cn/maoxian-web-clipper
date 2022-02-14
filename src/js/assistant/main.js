"use strict";

import Log       from '../lib/log.js';
import ExtMsg    from '../lib/ext-msg.js';
import MxWcEvent from '../lib/event.js';
import Plan      from './plan.js';

const config = {
  hideElem: true,
  showElem: true,
  hideSibling: true,
  changeAttr: true,
  removeAttr: true,
  execCmd: true,
  setForm: true,
  setConfig: true,

  // 'select' 'confirm' or 'clip'
  pickAction: 'select',
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
  if(config.execCmd && plan.command) { p.command = plan.command }
  if(config.hideElem && plan.hide) { p.hideElem = plan.hide }
  if(config.hideElem && plan.hideOnce) { p.hideElemOnce = plan.hideOnce }
  if(config.showElem && plan.show) { p.showElem = plan.show }
  if(config.hideSibling && plan.hideSibling) { p.hideSibling = plan.hideSibling }
  if(config.changeAttr && plan.chAttr) { p.chAttr = plan.chAttr }
  if(config.removeAttr && plan.rmAttr) { p.rmAttr = plan.rmAttr }
  if(config.setForm && plan.form) { p.setForm = plan.form }
  if(config.setConfig && plan.config) { p.setConfig = plan.config }
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
        sendAssistantEv('plan-disabled');
      } else {
        Plan.apply(toMxPlan(pagePlan));
        Log.debug("the page plan has been applied");
        Log.debug(pagePlan);
        if (!pagePlan.pick) {
          sendAssistantEv('plan-has-not-pick');
        }
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
