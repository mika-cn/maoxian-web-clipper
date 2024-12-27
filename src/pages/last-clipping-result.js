"use strict";

import localeEn    from '../_locales/en/last-clipping-result.js';
import localeZhCN  from '../_locales/zh_CN/last-clipping-result.js';
import I18N        from '../js/lib/translation.js';
import T           from '../js/lib/tool.js';
import ExtApi      from '../js/lib/ext-api.js';
import MxWcLink    from '../js/lib/link.js'
import MxWcStorage from '../js/lib/storage.js';
import MxWcConfig  from '../js/lib/config.js';

const state = {};

function renderNotClippingResult() {
  const template = T.findElem('tpl-not-clipping-result').innerHTML;
  const html = T.renderTemplate(template, {content: I18N.t('notice.not-clipping-result')});
  T.setHtml('.main', html);
}


function renderLastClippingResult() {
  const {failedTaskNum} = state.lastClippingResult;
  if(failedTaskNum > 0) {
    renderFailedTasks();
    renderClippingUrl();
  } else {
    renderClippingUrl();
  }
}

function renderFailedTasks() {
  const {originalUrl, failedTaskNum, failedTasks} = state.lastClippingResult;
  if(failedTaskNum > 0) {
    const template = T.findElem('tpl-failed-task').innerHTML;
    const failureMessage = I18N.s('message.failed-task-num', {num: failedTaskNum});
    const helpMessage = I18N.t('message.help');
    let detail = "";
    failedTasks.forEach((task) => {
      const errMsg = "<br />" + task.errMsg.replace(/\n/g, '<br />');
      detail += ["<div class='task'>" + I18N.t('label.file') + task.filename, I18N.t('label.err-msg') + "<span class='red'>" + errMsg + '</span>'].join("</div>");
    });
    const html = T.renderTemplate(template, {
      failureMessage: failureMessage,
      helpMessage: helpMessage,
      originalUrlLabel: I18N.t('label.original-url'),
      originalUrl: originalUrl,
      detail: detail
    });
    T.setHtml('#failed-task', html);
  }
}

async function renderClippingUrl() {
  const {url, failedTaskNum, failedTasks, downloadItemId} = state.lastClippingResult;
  let notice = I18N.t('notice.openable-url');
  let openMethod = 'open.link';

  if (downloadItemId) {
    const downloadItem = await ExtApi.findDownloadItem(downloadItemId)
    if (downloadItem) {
      openMethod = 'open.downloadItem'
    }
  }

  if(openMethod != 'open.downloadItem'
    && url.startsWith('file')
    && !(state.allowFileUrlAccess)
  ) {
    notice = I18N.t('notice.can-not-open-file-url');
  }

  const template = T.findElem('tpl-clipping-url').innerHTML;
  let html = T.renderTemplate(template, {notice, url, openMethod});
  T.setHtml('#clipping-url', html);

  const link = T.findElem('target-url');
  if (link) { T.bindOnce(link, 'click', clickTargetUrl) }

  const input = T.queryElem('.copy-box > input')
  if (input) {
    T.bindOnce(input, 'mouseover', selectInput);
    input.select();
  }
}


function selectInput(e) {
  this.select() ;
}


function clickTargetUrl(e) {
  const link = e.target;
  switch(link.getAttribute('data-method')) {
    case 'open.link': break;
    case 'open.downloadItem':
      ExtApi.openDownloadItem(state.lastClippingResult.downloadItemId);
      e.preventDefault();
      e.stopPropagation();
      break;
    case 'open.illegle':
      e.preventDefault();
      e.stopPropagation();
      break
  }
}

function render() {
  I18N.init({localeEn, localeZhCN});
  MxWcLink.listen(document.body);
  Promise.all([
    MxWcConfig.load(),
    ExtApi.isAllowedFileSchemeAccess(),
    MxWcStorage.get('lastClippingResult')
  ]).then((values) => {
    const [config, allowFileSchemeAccess, lastClippingResult] = values;
    state.allowFileUrlAccess = (allowFileSchemeAccess || config.allowFileSchemeAccess);
    state.config = config;

    if(lastClippingResult){
      state.lastClippingResult = lastClippingResult;
      renderLastClippingResult();
      MxWcStorage.set('lastClippingResult', null);
    } else {
      renderNotClippingResult();
    }
  });
}

render();
