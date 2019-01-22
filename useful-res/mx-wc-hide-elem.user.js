// ==UserScript==
// @name         mx-wc.hide-elem
// @namespace    hide-elem@MaoXian.OwnYourData
// @version      0.0.1
// @description  Hide useless elements when MaoXian is active.
// @author       MaoXian Fan
// @require      https://mika-cn.github.io/maoxian-web-clipper/mx-wc-tool-v0.0.5.js
// @include     *
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  let allRules = [];

  /* *****************************************************
   * Putting keys here to disable common rules
   * *****************************************************/
  const keyBlackList = [
    'all.buttons',
  ];

  function getWebsiteRules(){
  /* *****************************************************
   * Putting rule here
   * *****************************************************/
    return (`
      dev.mika||#debug
      *.mika||.site-header
      *.mika||.site-footer
      *.mika||time
    `).split("\n");
  }


  function getCommonRules(){
    const rules = [];
    const g = function(key, rule) {
      if(keyBlackList.indexOf(key) === -1){
        rules.push(rule);
      }
    };
    g('all.forms', 'C||*||/||form');
    g('all.buttons', 'C||*||/||button');
    return rules;
  }

  function init(){
    const ruleA = getCommonRules();
    const ruleB = getWebsiteRules();
    const cmd = MxWc.newHideCmd();
    cmd.init(ruleA.concat(ruleB));
  }

  init();
})();
