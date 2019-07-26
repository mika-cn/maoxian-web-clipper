// ==UserScript==
// @name         mx-wc.assistant
// @namespace    assistant@MaoXian.OwnYourData
// @version      0.0.2
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
  // Warning
  //=============================
  // Don't edit this file directly. it's content will automatic update by your userScript extension.
  // You can create a new userScript by copy content of this script and edit the new userScript instead.

  //=============================
  // Configurable
  //=============================
  // Configuration
  const HIDE_ELEM = true;
  const SHOW_ELEM = true;
  const CHANGE_ATTR = true;
  // Action that MaoXian will take when content element is selected.
  // "focus", "confirm" or "clip"
  const PICK_ACTION = "focus"

  // These actions will apply to whole document
  const HIDE_ALL_FORM_ELEMENT = true;

  // If we can't find any plan to apply, try to guess main content.
  const GUESS_MAIN_CONTENT = true;
  const GUESS_SELECTORS = [ 'article', '.article', '.post'];

  // If our guess failed, try to detect main content.
  const DETECT_MAIN_CONTENT = false;

  // Plans
  //   custom: plan that write by youself.
  //   website: plan that contributed by everyone.
  // priority
  //   custom > website

  // write your own custom plan
  const customPlans = [];

  // website is loaded by userScript
  var websitePlans = (window.websitePlans || []);




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
    if(plan.pick) {
      p.pickElem = plan.pick;
      p.pickAction = (plan.pickAction || PICK_ACTION);
    }
    if(HIDE_ELEM && plan.hide) { p.hideElem = plan.hide }
    if(SHOW_ELEM && plan.show) { p.showElem = plan.show }
    if(CHANGE_ATTR && plan.chAttr) { p.chAttr = plan.chAttr }
    return p;
  }

  function pickSelector(it) {
    MxWc.apply({
      pickElem: it,
      pickAction: PICK_ACTION
    })
  }

  //=============================

  function hideAllFormElement() {
    if(HIDE_ALL_FORM_ELEMENT) {
      MxWc.applyGlobal({hideElem: 'form'});
    }
  }

  // return selector
  function guessMainContent() {
    if(GUESS_MAIN_CONTENT) {
      for(let i = 0; i < GUESS_SELECTORS.length; i++) {
        const elems = document.querySelectorAll(GUESS_SELECTORS[i])
        if(elems.length === 1) {
          return GUESS_SELECTORS[i];
        }
      }
    }
    return undefined;
  }

  // return selector
  function detectMainContent() {
    if(DETECT_MAIN_CONTENT) {
      // TODO
      // Maybe we can find a library to do this.
    }
    return undefined;
  }


  function main() {
    hideAllFormElement();
    const url = window.location.href;
    //console.debug("MX-Assistant", url);
    const plan = findFirstMatchedPlan(url);
    if(plan) {
      MxWc.apply(toMxPlan(plan));
    } else {
      console.debug("MxWcAssistant", "Not plan matched");
      let selector = guessMainContent();
      if(!selector) {
        selector = detectMainContent();
      }
      if(selector) {
        pickSelector(selector);
      } else {
        // Oops :)
      }
    }
  }

  main();

})();
