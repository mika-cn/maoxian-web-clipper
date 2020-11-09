"use strict";

import ENV      from '../js/env.js';
import T        from '../js/lib/tool.js';
import I18N     from '../js/lib/translation.js';
import ExtApi   from '../js/lib/ext-api.js';
import MxWcLink from '../js/lib/link.js';

function initListener(){
  const elems = T.queryElems('.tab-link');
  T.each(elems, (elem) => {
    T.bind(elem, 'click', function(e){
      const link = e.target.getAttribute('link');
      e.preventDefault();
      ExtApi.createTab(link);
    });
  });
}

function render(){
  const template = T.findElem('welcome-page-tpl').innerHTML;
  const html = T.renderTemplate(template, {
    installationHint: installationHint(),
    extraStep1: extraStep1(),
    extraStep2: extraStep2(),
  });
  T.setHtml('.main', html);
}


function installationHint(){
  return I18N.t('installation-hint').replace('$version', "V" + ENV.version);
}

function extraStep1(){
  if(MxWcLink.isChrome()){
    return I18N.t('extra-1-chrome');
  } else {
    return I18N.t('extra-1-firefox');
  }
}

function extraStep2(){
  if(MxWcLink.isChrome()) {
    let html =I18N.t('extra-2-chrome');
    html = html.replace('$extensionLink',
      `<a href='' link='${"chrome://extensions?id=" + MxWcLink.extensionId}' class='tab-link'>chrome-extensions</a>`
    );
    return html;
  } else {
    return I18N.t('extra-2-firefox');
  }
}

function init(){
  render();
  initListener();
  MxWcLink.listen(document.body);
}

init();
