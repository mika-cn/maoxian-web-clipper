// ==UserScript==
// @name         mx-wc.focus-elem
// @namespace    focus-elem@MaoXian.OwnYourData
// @version      0.0.1
// @description  Focus main element when MaoXian is active.
// @author       MaoXian Fan
// @require      https://mika-cn.github.io/maoxian-web-clipper/mx-wc-tool-v0.0.4.js
// @include     *
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  let allRules = []

  function addHostRelativeRules() {
    const h = addIfHostMatched;
    h('blog.csdn.net', '.blog-content-box');
    h('news.cnblogs.com', '#news_main');
    h('*.iteye.com', '.blog_main');
    h('juejin.im', '.main-area');
    h('my.oschina.net', '.float-menu-content');
    h('www.cnblogs.com', [
      '#mainContent',
      '#post_detail',
      '#topics'
    ]);
  }

  function addCommonRules(){
    const querys = [
      'article',
      '.article',
      '.article-detail',
      '.article-box',
      '.article-main',
      '#main',
      '.main',
      '.main_left',
      '#post',
      '.post',
      '#posts',
      '#topics',
    ];
    querys.forEach(function(q) {
      const elems = document.querySelectorAll(q);
      if(elems.length === 1) {
        addTarget(q);
      }
    });
  }

  function init() {
    addHostRelativeRules();
    if(allRules.length === 0) {
      addCommonRules();
    }
    const cmd = MxWc.newConfirmCmd();
    cmd.init(allRules);
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
