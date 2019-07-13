
"use strict";

// http://kb.mozillazine.org/Firefox_:_Issues_:_Links_to_Local_Pages_Don%27t_Work
(function(){


  // ======================================
  // init form inputs
  // ======================================

  function initSettingGeneral(config) {
    // clipping content
    initCheckboxInput(config,
      'save-clipping-information',
      'saveClippingInformation'
    );
    initCheckboxInput(config,
      'save-web-font',
      'saveWebFont'
    );
    initCheckboxInput(config,
      'save-css-image',
      'saveCssImage'
    );
    initCheckboxInput(config,
      'save-domain-as-tag',
      'saveDomainAsTag'
    );

    // control
    initCheckboxInput(config,
      'hotkey-switch-enabled',
      'hotkeySwitchEnabled',
    );

    initCheckboxInput(config,
      'mouse-mode-enabled',
      'mouseModeEnabled',
    );

    // File url access
    initCheckboxInput(config,
      'file-scheme-access-input',
      'allowFileSchemeAccess'
    );

  }

  // section: Storage
  function initSettingStorage(config) {
    initOptionsInput(config,
      'storage-handler',
      'clippingHandler'
    );
  }

  // section: handler-browser
  function initSettingHandlerBrowser(config) {
    initCheckboxInput(config,
      'handler-browser-enabled',
      'handlerBrowserEnabled'
    );
  }

  // section: handler-native-app
  function initSettingHandlerNativeApp(config) {
    initCheckboxInput(config,
      "handler-native-app-enabled",
      "handlerNativeAppEnabled",
    );
  }

  function initSettingSaveFormat(config){
    initOptionsInput(config,
      'save-format',
      'saveFormat'
    );
  }

  // local path relative
  function initSettingPath(config) {
    initTextInput(config,
      'default-category',
      'defaultCategory'
    );

    initTextInput(config,
      'asset-path',
      'assetPath'
    );

    initCheckboxInput(config,
      'save-title-as-filename',
      'saveTitleAsFilename'
    );
    initCheckboxInput(config,
      'save-title-as-fold-name',
      'saveTitleAsFoldName'
    );

    initRadioInput(config,
      'default-clipping-folder-format',
      'defaultClippingFolderFormat'
    );

    initRadioInput(config,
      'title-style-clipping-folder-format',
      'titleStyleClippingFolderFormat'
    );
  }

  // section: refresh history
  function initRefreshHistory(config) {
    initOptionsInput(config,
      'refresh-history-handler',
      'refreshHistoryHandler'
    );

    initCheckboxInput(config,
      'auto-refresh-history',
      'autoRefreshHistory'
    );
  }

  // section: offline page
  function initOfflinePage(config) {
    initOptionsInput(config,
      'offline-page-handler',
      'offlinePageHandler'
    );

    initCheckboxInput(config,
      'autogenerate-clipping-js',
      'autogenerateClippingJs'
    );
    initTextInput(config,
      'clipping-js-path',
      'clippingJsPath'
    );
  }

  // ======================================
  // init form input END
  // ======================================

  function setConfigKey(elem, key) {
    elem.setAttribute('data-config-key', key);
  }

  function getConfigKey(elem) {
    return elem.getAttribute('data-config-key');
  }

  function initCheckboxInput(config, elemId, configKey){
    const elem = T.findElem(elemId);
    elem.checked = config[configKey];
    setConfigKey(elem, configKey);
    T.bindOnce(elem, 'change', checkBoxChanged)
  }

  function checkBoxChanged(e) {
    const configKey = getConfigKey(e.target);
    MxWcConfig.update(configKey, e.target.checked);
  }

  function initRadioInput(config, elemId, configKey){
    const elem = T.findElem(elemId);
    setConfigKey(elem, configKey);
    T.bindOnce(elem, 'change', radioInputChanged)
    checkRadioInput(elem, config[configKey]);
  }

  function radioInputChanged(e) {
    const container = T.findParentById(e.target, e.target.name);
    const configKey = getConfigKey(container);
    MxWcConfig.update(configKey, e.target.value);
  }

  function checkRadioInput(container, value) {
    const radioInputs = T.queryElems(`input[type=radio]`, container);
    radioInputs.forEach((it) => {
      if(it.value === value) {
        it.checked = true;
      }
    });
  }

  function initTextInput(config, elemId, configKey){
    const elem = T.findElem(elemId);
    elem.value = config[configKey];
    setConfigKey(elem, configKey);
    T.bindOnce(elem, 'blur', textInputBlured);
  }

  function textInputBlured(e) {
    const configKey = getConfigKey(e.target);
    if(MxWcConfig.update(configKey, e.target.value)){
      Notify.success(t('op.update-success'));
    }
  }

  function initOptionsInput(config, elemId, configKey){
    const elem = T.findElem(elemId);
    setConfigKey(elem, configKey);
    T.bindOnce(elem, 'click', optionChanged);
    updateOptionsState(elem, config[configKey]);
  }

  function optionChanged(e) {
    if(e.target.tagName === 'A'){
      const elem = e.target.parentElement;
      const configKey = getConfigKey(elem);
      const value = e.target.getAttribute('data-value');
      MxWcConfig.update(configKey, value)
      updateOptionsState(elem, value)
    }
  }

  function updateOptionsState(elem, value) {
    let matched = false;
    T.each(elem.children, (option) => {
      const optionValue = option.getAttribute('data-value');
      if(optionValue === value){
        matched = true
        if(!option.classList.contains('active')) {
          option.classList.add('active');
          updatePageContentIfNeed(elem.id, value);
        }
      } else {
        option.classList.remove('active');
      }
    });
    if(!matched && elem.children.length > 0) {
      // If reach here (matched is false). It means the configured value is not in options.
      // So we choose first child as configured value.
      const firstValue = elem.children[0].getAttribute('data-value');
      const configKey = getConfigKey(elem);
      // We've got two config update here.
      // To avoid race condition, execute this update next tick.
      setTimeout(() => MxWcConfig.update(configKey, firstValue), 0)
      updateOptionsState(elem, firstValue);
    }
  }

  function updatePageContentIfNeed(elemId, value) {
    switch(elemId) {
      case 'storage-handler':
        storageHandlerChanged(value);
        break;
      case 'offline-page-handler':
        offlinePageHandlerChanged(value);
        break;
      case 'refresh-history-handler':
        refreshHistoryHandlerChanged(value)
        break;
    }
  }

  function storageHandlerChanged(value) {
    const sectionId = 'setting-storage';
    getHandlerStatusAndRenderNotice(sectionId, 'storage', value)
    .then(({isEnabled, handlerInfo, section}) => {
      T.queryElem('.save-format', section).classList.remove('active');
      T.queryElem('.local-path', section).classList.remove('active');
      if(isEnabled && handlerInfo.ready) {
        renderSaveFormat(section, handlerInfo.supportFormats);
        if(['Browser', 'NativeApp'].indexOf(value) > -1) {
          renderLocalPathOptions(section);
        }
        i18nPage();
      }
    });
  }

  function offlinePageHandlerChanged(value) {
    const sectionId = 'setting-offline-page';
    getHandlerStatusAndRenderNotice(sectionId, 'offline-page', value)
    .then(({isEnabled, handlerInfo, section}) => {
      const elem = T.queryElem('.detail', section);
      elem.classList.remove('active');
      if(isEnabled && handlerInfo.ready) {
        elem.classList.add('active');
      }
    });
  }

  function refreshHistoryHandlerChanged(value) {
    const sectionId = 'setting-refresh-history';
    getHandlerStatusAndRenderNotice(sectionId, 'refresh-history', value)
    .then(({isEnabled, handlerInfo, section}) => {
      const elem = T.queryElem('.detail', section);
      elem.classList.remove('active');
      if(isEnabled && handlerInfo.ready) {
        elem.classList.add('active');
      }
    });
  }

  function getHandlerStatusAndRenderNotice(sectionId, name, value) {
    return new Promise(function(resolve, reject) {
      const section = T.findElem(sectionId);
      const msgA = getNoticeMsg('info', [name, T.deCapitalize(value)]);
      const msgB = getNoticeMsg('warning', [name, T.deCapitalize(value)]);
      renderNoticeBox(section, 'info', msgA);
      renderNoticeBox(section, 'warning', msgB);
      MxWcHandler.isReady(value)
      .then((result) => {
        const {ok, message, enabled, handlerInfo} = result;
        if(ok) {
          renderNoticeBox(section, 'danger', '$BLANK');
        } else {
          renderNoticeBox(section, 'danger', message);
        }
        resolve({
          isEnabled: enabled,
          handlerInfo: handlerInfo,
          section: section
        })
      });
    });
  }

  function renderLocalPathOptions(section) {
    const div = T.queryElem('.local-path', section);
    div.classList.add('active');
    MxWcConfig.load().then((config) => {
      initSettingPath(config);
    });
  }

  function renderSaveFormat(section, formats) {
    const div = T.queryElem('.save-format', section);
    div.classList.add('active');
    const html = renderOptions(formats, 'format');
    const elem = T.queryElem('#save-format', section);
    T.setHtml(elem, html);
    MxWcConfig.load().then((config) => {
      console.log("RenderSaveFormat", config.saveFormat);
      initSettingSaveFormat(config)
    });
  }


  function renderOptions(options, type) {
    const optionTpl = T.findElem('option-tpl').innerHTML;
    const arr = [];
    options.forEach((it) => {
      const r = T.renderTemplate(optionTpl, {
        value: it,
        name: t('option', type, it, 'name')
      });
      arr.push(r);
    });
    return arr.join("\n");
  }


  function getNoticeMsg(type, names) {
    return t('setting', 'notice', type, ...names);
  }

  function renderNoticeBox(section, type, msg) {
    const box = T.queryElem(`.${type}-box`, section);
    if(msg === "$BLANK") {
      T.setHtml(box, '');
    } else {
      renderNotice(type, box, msg);
    }
  }


  // type: 'info', 'danger', 'warning'
  function renderNotice(type, box, message) {
    const template = T.findElem('notice-tpl').innerHTML;
    const html = T.renderTemplate(template, {
      type: type,
      message: message
    });
    T.setHtml(box, html);
  };


  /* button click handlers */

  function generateClippingJsNow(e) {
    ExtApi.sendMessageToBackground({
      type: 'generate.clipping.js'
    }).then((result) => {
      if(result.ok) {
        const label = T.findElem('last-generate-clipping-js-time');
        T.setHtml(label, result.time);
        Notify.success(t('setting.generate-now-success.label'));
      } else {
        Notify.error(t(result.message))
      }
    });
    Notify.success(t('setting.generate-now-msg-sent.label'));
  }

  function refreshHistoryNow(e) {
    ExtApi.sendMessageToBackground({
      type: 'history.refresh'
    }).then((result) => {
      if(result.ok) {
        const label = T.findElem('last-refresh-history-time');
        T.setHtml(label, result.time);
        Notify.success(t('setting.refresh-now-success.label'));
      } else {
        Notify.error(t(result.message))
      }
    });
    Notify.success(t('setting.refresh-now-msg-sent.label'));
  }

  function renderSection(id) {
    const container = T.queryElem('.content');
    const template = getSectionTemplate(id);
    let render = () => {};
    switch(id) {
      case 'setting-general':
        render = renderSectionGeneral;
        break;
      case 'setting-storage':
        render = renderSectionStorage;
        break;
      case 'setting-handler-browser':
        render = renderSectionHandlerBrowser;
        break;
      case 'setting-handler-native-app':
        render = renderSectionHandlerNativeApp;
        break;
      case 'setting-offline-page':
        render = renderSectionOfflinePage;
        break;
      case 'setting-refresh-history':
        render = renderSectionRefreshHistory;
        break;
    }
    render(id, container, template);
  }

  function getSectionTemplate(sectionId) {
    const tplId = ["section",  sectionId, "tpl"].join("-");
    return T.findElem(tplId).innerHTML;
  }


  function renderSectionGeneral(id, container, template) {
    const html = T.renderTemplate(template, {
      host: window.location.origin
    });
    T.setHtml(container, html);
    i18nPage(container);
    MxWcConfig.load().then((config) => {
      initSettingGeneral(config);
    });
  }

  function renderSectionStorage(id, container, template) {
    const html = template;
    T.setHtml(container, html);
    i18nPage(container);
    MxWcConfig.load().then((config) => {
      initSettingStorage(config);
    });
  }

  function renderSectionHandlerBrowser(id, container, template) {
    const html = template;
    T.setHtml(container, html);
    i18nPage(container);
    MxWcConfig.load().then((config) => {
      initSettingHandlerBrowser(config);
    });
  }

  function renderSectionHandlerNativeApp(id, container, template) {
    const html = template;
    T.setHtml(container, html);
    i18nPage(container);
    MxWcConfig.load().then((config) => {
      initSettingHandlerNativeApp(config);
    });
    ExtApi.sendMessageToBackground({
      type: 'handler.get-info',
      body: {name: 'NativeApp'}
    }).then((info) => {
      console.log(info);
    const section = T.findElem(id);
      if(info.ready) {
        const elem = T.queryElem('.version-value', section);
        elem.innerText = info.version
        T.queryElem('.version', section)
          .classList.add('active');
      } else {
        // render errors
        let msg = t('setting.notice.danger.native-app-not-ready');
        msg = msg.replace('$MESSAGE', info.message);
        renderNoticeBox(section, 'danger', msg);
      }
    });
  }

  function renderSectionOfflinePage(id, container, template) {
    MxWcStorage.get('lastGenerateClippingJsTime')
    .then((time) => {
      const html = T.renderTemplate(template, {
        lastGenerateClippingJsTime: (time || ''),
      });
      T.setHtml(container, html);
      i18nPage();
      MxWcConfig.load().then((config) => {
        initOfflinePage(config)
      });
      bindButtonListener('generate-clipping-js-now', generateClippingJsNow);
    });
  }

  function renderSectionRefreshHistory(id, container, template) {
    MxWcStorage.get('lastRefreshHistoryTime')
    .then((time) => {
      const html = T.renderTemplate(template, {
        lastRefreshHistoryTime: (time || ''),
      });
      T.setHtml(container, html);
      i18nPage();
      MxWcConfig.load().then((config) => {
        initRefreshHistory(config)
      });
      bindButtonListener('refresh-history-now', refreshHistoryNow);
    });
  }

  function bindButtonListener(id, handler){
    const btn = T.findElem(id);
    T.bindOnce(btn, 'click', handler);
  }


  function menuClicked(elem) {
    T.each(elem.parentNode.children, (menu) => {
      menu.classList.remove('active');
    });
    elem.classList.add('active');
    const sectionId = elem.href.split('#')[1];
    renderSection(sectionId);
  }


  function initSidebar(){
    const sidebar = T.queryElem('.sidebar');
    const sidebarFolder = T.queryElem('.sidebar-folder');
    T.bind(sidebarFolder, 'click', function(e) {
      if(e.target.classList.contains('active')) {
        e.target.classList.remove('active');
        T.setHtml(e.target, 'M');
      } else {
        e.target.classList.add('active');
        T.setHtml(e.target, ">>");
      }
    }, true);
    T.bind(sidebar, 'click', function(e){
      const elem = e.target;
      if(elem.classList.contains('menu')) {
        menuClicked(elem);
      }
    });
  }

  function activeMenu() {
    const hash = (window.location.hash || "#setting-general");
    const menu = T.queryElem(`a[href="${hash}"]`);
    setTimeout(() => menuClicked(menu), 0)
  }

  function init(){
    i18nPage();
    initSidebar();
    MxWcLink.listen(document.body);
    activeMenu();
  }

  init();
})();
