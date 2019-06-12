// ==UserScript==
// @name         mx-wc.assistant
// @namespace    assistant@MaoXian.OwnYourData
// @version      0.0.1
// @description  This script will interacte with MaoXian Web Clipper to ensure better experience
// @author       MaoXian Fan
// @require      $assistant_website_plans
// @require      $assistant_fuzzy_matcher
// @require      $assistant_mx_wc_tool
// @include     *
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  //=============================
  // Configurable
  //=============================
  // Configuration
  const HIDE_ELEM = true;
  // Action that MaoXian will take when content element is selected.
  // "focus", "confirm" or "clip"
  const PICK_ACTION = "focus"

  // Plans
  //   custom: plan that write by youself.
  //   website: plan that contributed by everyone.
  // priority custom > website

  // write your own custom plan
  const customPlans = [
    {
      pattern: "http://*.mika/maoxian-web-clipper/",
      pick: [".main"],
      hide: ["ul"]
    },
    {
      pattern: "http://*.mika/blog/**/*/*/*/*/*.html",
      pick: [".page-content"],
      hide: ["header"]
    }
  ];

  // website is loaded by userScript
  var websitePlans = (websitePlans || []);




  //=============================

  function findFirstMatchedPlan(url) {
    const customPlan = match(customPlans, url);
    if(customPlan) { return customPlan }
    return match(websitePlans, url);
  }

  function match(plans, currUrl) {
    return plans.find(function(plan) {
      return FuzzyMatcher.matchUrl(currUrl, plan.pattern)
    })
  }

  function toMxPlan(plan) {
    const p = {}
    if(HIDE_ELEM) { p.hideElem = plan.hide}
    p.pickElem = plan.pick;
    p.pickAction = (plan.pick_action || PICK_ACTION)
    return p;
  }

  function main() {
    const url = window.location.href;
    const plan = findFirstMatchedPlan(url);
    if(plan) {
      MxWc.apply(toMxPlan(plan));
    } else {
      console.log("MxWc", "Not matched plan");
    }
  }

  main();

})();
