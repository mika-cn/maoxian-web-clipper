// ==UserScript==
// @name         mx-wc.focus-elem
// @namespace    focus-elem@MaoXian.OwnYourData
// @version      0.0.1
// @description  Focus main element when MaoXian is active.
// @author       MaoXian Fan
// @require      https://mika-cn.github.io/maoxian-web-clipper/mx-wc-tool-v0.0.5.js
// @include     *
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  function getPreciseRules(){
    return (`
    dev.mika||/maoxian-web-clipper/||div.main
    *.iteye.com||.blog_main
    juejin.im||.main-area
    `).split("\n");
  }

  function getCommonRules(){
    const querys = [
      'article',
      '.article',
      '#article',
      '.article-detail',
      '.article-box',
      '.article-main',
      '#post',
      '.post',
    ];
    const rules = [];
    querys.forEach(function(q) {
      const elems = document.querySelectorAll(q);
      if(elems.length === 1) {
        const rule = `C||*||/||${q}`;
        rules.push(rule);
      }
    });
    return rules;
  }

  function init() {
    let cmd = MxWc.newConfirmCmd();
    cmd.init(getPreciseRules())
      .then((matchedRules) => {
        if(matchedRules.length === 0) {
          cmd.cancel();
          cmd = undefined;
          cmd = MxWc.newFocusCmd();
          cmd.init(getCommonRules());
        }
      });
  }

  init();
})();
