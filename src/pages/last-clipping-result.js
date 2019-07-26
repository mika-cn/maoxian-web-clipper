"use strict";
(function(){
  const state = {};

  function renderNotClippingResult() {
    const template = T.findElem('tpl-not-clipping-result').innerHTML;
    const html = T.renderTemplate(template, {content: t('lcr.notice.not-clipping-result')});
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
    const {failedTaskNum, failedTasks} = state.lastClippingResult;
    if(failedTaskNum > 0) {
      const template = T.findElem('tpl-failed-task').innerHTML;
      const message = t('lcr.message.failed-task-num').replace('$num', failedTaskNum);
      let detail = "";
      failedTasks.forEach((task) => {
        detail += ["<div class='task'>" + t('lcr.label.file') + task.filename, t('lcr.label.err-msg') + "<span class='red'>" + task.errMsg + '</span>'].join("</div>");
      });
      const html = T.renderTemplate(template, {message: message, detail: detail});
      T.setHtml('#failed-task', html);
    }
  }

  function renderClippingUrl() {
    const {url, failedTaskNum, failedTasks} = state.lastClippingResult;
    const template = T.findElem('tpl-clipping-url').innerHTML;
    let notice = t('lcr.notice.openable-url');
    if(url.startsWith('file') && !(state.allowFileUrlAccess)) {
      notice = t('lcr.notice.can-not-open-file-url');
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

})();
