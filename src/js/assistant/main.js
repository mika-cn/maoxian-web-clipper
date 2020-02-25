;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/log.js'),
      require('../lib/ext-msg.js'),
      require('../lib/event.js'),
      require('./plan.js')
    );
  } else {
    // browser or other
    root.MxWcAssistantMain = factory(
      root.MxWcLog,
      root.MxWcExtMsg,
      root.MxWcEvent,
      root.MxWcAssistantPlan
    );
  }
})(this, function(Log, ExtMsg, MxWcEvent, Plan, undefined) {
  "use strict";

  const config = {
    hideElem: true,
    showElem: true,
    changeAttr: true,

    // 'focus' 'confirm' or 'clip'
    pickAction: 'focus',

    // These actions will apply to whole document
    hideAllFormElement: true,

    // If our guess failed, try to detect main content.
    detectMainContent: false,
  }

  function getPlan() {
    return ExtMsg.sendToBackground({
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
    getPlan().then((plan) => {
      if (plan) {
        Plan.apply(toMxPlan(plan));
      } else {
        Log.debug("NotPlan matched");
        setTimeout(() => {
          MxWcEvent.dispatchInternal('assistant.not-plan-matched');
        }, 0);
      }
    });
  }

  return {
    init: init,
    listenInternalEvent: listenInternalEvent
  }
});
