;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcAssistantMain = factory(
      root.MxWcExtMsg,
      root.MxWcAssistantPlan
    );
  }
})(this, function(ExtMsg, Plan, undefined) {
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
    if(config.showElem && plan.show) { p.showElem = plan.show }
    if(config.changeAttr && plan.chAttr) { p.chAttr = plan.chAttr }
    return p;
  }

  function init() {
    getPlan().then((plan) => {
      if (plan) {
        Plan.apply(toMxPlan(plan));
      } else {
        console.log("NotPlan matched");
      }
    });
  }

  return { init: init }
});
