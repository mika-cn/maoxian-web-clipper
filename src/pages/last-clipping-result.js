"use strict";

import I18N        from '../js/lib/translation.js';
import T           from '../js/lib/tool.js';
import ExtApi      from '../js/lib/ext-api';
import MxWcStorage from '../js/lib/storage.js';
import MxWcConfig  from '../js/lib/config.js';

import './_base.css';
import './last-clipping-result.css';

const state = {};

function renderNotClippingResult() {
  const template = T.findElem('tpl-not-clipping-result').innerHTML;
  const html = T.renderTemplate(template, {content: I18N.t('lcr.notice.not-clipping-result')});
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
    const message = I18N.t('lcr.message.failed-task-num').replace('$num', failedTaskNum);
    let detail = "";
    failedTasks.forEach((task) => {
      detail += ["<div class='task'>" + I18N.t('lcr.label.file') + task.filename, I18N.t('lcr.label.err-msg') + "<span class='red'>" + task.errMsg + '</span>'].join("</div>");
    });
    const html = T.renderTemplate(template, {
      message: message,
      originalUrlLabel: I18N.t('lcr.label.original-url'),
      originalUrl: originalUrl,
      detail: detail
    });
    T.setHtml('#failed-task', html);
  }
}

function renderClippingUrl() {
  const {url, failedTaskNum, failedTasks} = state.lastClippingResult;
  const template = T.findElem('tpl-clipping-url').innerHTML;
  let notice = I18N.t('lcr.notice.openable-url');
  if(url.startsWith('file') && !(state.allowFileUrlAccess)) {
    notice = I18N.t('lcr.notice.can-not-open-file-url');
  }
  let html = T.renderTemplate(template, {notice: notice, url: url});
  T.setHtml('#clipping-url', html);
}

function render() {
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
