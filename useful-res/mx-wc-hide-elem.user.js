// ==UserScript==
// @name         mx-wc.hide-elem
// @namespace    hide-elem@MaoXian.OwnYourData
// @version      0.0.1
// @description  Hide useless elements when MaoXian is active.
// @author       MaoXian Fan
// @require      https://mika-cn.github.io/maoxian-web-clipper/mx-wc-tool-v0.0.4.js
// @include     *
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  let allRules = [];

  /* *****************************************************
   * Putting keys here to disable global rules
   * *****************************************************/
  const keyBlackList = [
    'all.buttons',
  ];

  function init(){

    /* *****************************************************
     * Add Rules Here
     * *****************************************************/
    // Global Rules
    const g = addIfNotInBlackList;
    g('all.forms', 'C||*||/||form');
    g('all.buttons', 'C||*||/||button');


    // Host Relative Rules
    const h = addIfHostMatched;
    h('dev.mika', '#debug');
    h('*.mika', ['.site-header', '.site-footer', 'time']);

    const cmd = MxWc.newHideCmd();
    cmd.init(allRules);
  }

  function addIfNotInBlackList(key, target) {
    if(keyBlackList.indexOf(key) === -1){
      addTarget(target);
    }
  }

  function addIfHostMatched(ruleHost, target) {
    const currHost = window.location.host;
    const matched = MxWc.Rule.matchHost(ruleHost, currHost);
    if(matched){
      addTarget(target);
    }
    return matched;
  }

  function addTarget(target){
    if(typeof target === 'string') {
      addRule(toRule(target));
    } else {
      target.forEach((it) => {
        addRule(toRule(it));
      });
    }
  }

  function toRule(target) {
    if(target.indexOf('||') > -1) {
      return target;
    } else {
      return `C||*||/||${target}`;
    }
  }

  function addRule(rule) {
    allRules.push(rule)
  }

  function addRules(rules) {
    allRules = allRules.concat(rules)
  }

  init();
})();
