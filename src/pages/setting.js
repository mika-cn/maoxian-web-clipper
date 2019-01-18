
"use strict";

// http://kb.mozillazine.org/Firefox_:_Issues_:_Links_to_Local_Pages_Don%27t_Work
(function(){

  function renderUi() {
    const template = T.findElem('setting-page-tpl').innerHTML;
    let lastGenerateTime = t('setting.not-generated-yet.label');
    Promise.all([
      MxWcStorage.get('lastGenerateClippingJsTime'),
      MxWcStorage.get('lastRefreshHistoryTime'),
    ]).then((values) => {
      const [lastGenerateClippingJsTime, lastRefreshHistoryTime] = values;
      const html = T.renderTemplate(template, {
        settingFileUrlLink: MxWcLink.get('faq-allow-access-file-urls'),
        nativeAppUrl: MxWcLink.get('native-app'),
        offlinePageIntro: MxWcLink.get('offline-page'),
        lastGenerateClippingJsTime: (lastGenerateClippingJsTime || ''),
        lastRefreshHistoryTime: (lastRefreshHistoryTime || ''),
        host: window.location.origin
      });
      T.setHtml('.content', html);
      i18nPage();
      initButtonsListeners();
    });
  }

  function initUI() {
    MxWcConfig.load().then((config) => {
      initSettingFormat(config);
      initSettingPath(config);
      initSettingClippingContent(config)
      initFileSchemeAccess(config);
      initSettingHotkey(config);
      initSettingOther(config);
      initClippingHandler(config);
      initOfflinePage(config);
      initRefreshHistory(config);
    });
  }

  // section refresh history
  function initRefreshHistory(config) {
    initCheckboxInput(config,
      'auto-refresh-history',
      'autoRefreshHistory'
    );
  }

  // section offline page
  function initOfflinePage(config) {
    initCheckboxInput(config,
      'autogenerate-clipping-js',
      'autogenerateClippingJs'
    );
    initTextInput(config,
      'clipping-js-path',
      'clippingJsPath'
    );
  }

  // section path
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

    initTextInput(config,
      'default-clipping-folder-format',
      'defaultClippingFolderFormat'
    );

    initTextInput(config,
      'title-clipping-folder-format',
      'titleClippingFolderFormat'
    );
  }

  // section: clipping content
  function initSettingClippingContent(config) {
    initCheckboxInput(config,
      'save-clipping-information',
      'saveClippingInformation'
    );
    initCheckboxInput(config,
      'save-web-font',
      'saveWebFont'
    );
    initCheckboxInput(config,
      'save-domain-as-tag',
      'saveDomainAsTag'
    );
  }

  // section hotkey
  function initSettingHotkey(config){
    initCheckboxInput(config,
      'enable-switch-hotkey',
      'enableSwitchHotkey',
    );
  }

  // section other
  function initSettingOther(config){
    initCheckboxInput(config,
      'enable-mouse-mode',
      'enableMouseMode',
    );
  }

  // section: format
  function initSettingFormat(config){
    initOptionsInput(config,
      'setting-format',
      'saveFormat'
    );
  }

  // section: clipping-handler
  function initClippingHandler(config) {
    initOptionsInput(config,
      'clipping-handler',
      'clippingHandlerName'
    );
  }

  // section: file scheme access
  function initFileSchemeAccess(config){
    initCheckboxInput(config,
      'file-scheme-access-input',
      'allowFileSchemeAccess'
    );
  }

  function initCheckboxInput(config, elemId, configKey){
    const elem = T.findElem(elemId);
    elem.checked = config[configKey];
    T.bind(elem, 'click', (e) => {
      MxWcConfig.update(configKey, e.target.checked);
    });
  }

  function initTextInput(config, elemId, configKey){
    const elem = T.findElem(elemId);
    elem.value = config[configKey];
    T.bind(elem, 'blur', (e) => {
      if(MxWcConfig.update(configKey, e.target.value)){
        Notify.success(t('op.update-success'));
      }
    });
  }

  function initOptionsInput(config, elemId, configKey){
    const elem = T.findElem(elemId);
    T.bind(elem, 'click', (e) => {
      if(e.target.tagName === 'A'){
        const value = e.target.getAttribute('data-value');
        updateOptionsState(elem, value)
        MxWcConfig.update(configKey, value)
      }
    });
    updateOptionsState(elem, config[configKey]);
  }

  function updateOptionsState(elem, value) {
    T.each(elem.children, (option) => {
      option.classList.remove('active');
      const optionValue = option.getAttribute('data-value');
      if(optionValue === value){
        option.classList.add('active');
      }
    });
  }

  function initButtonsListeners(){
    bindButtonListener('generate-clipping-js-now', generateClippingJsNow);
    bindButtonListener('refresh-history-now', refreshHistoryNow);
  }

  function bindButtonListener(id, handler){
    const btn = T.findElem(id);
    T.bindOnce(btn, 'click', handler);
  }

  /* button click handlers */

  function generateClippingJsNow(e) {
    ExtApi.sendMessageToBackground({
      type: 'generate.clipping.js'
    }).then((result) => {
      const label = T.findElem('last-generate-clipping-js-time');
      label.innerHTML = result.time;
      Notify.success(t('setting.generate-now-success.label'));
    });
    Notify.success(t('setting.generate-now-msg-sent.label'));
  }

  function refreshHistoryNow(e) {
    MxWcConfig.load().then((config) => {
      if(config.clippingHandlerName === 'native-app') {
        ExtApi.sendMessageToBackground({
          type: 'history.refresh'
        }).then((result) => {
          if(result.ok) {
            const label = T.findElem('last-refresh-history-time');
            label.innerHTML = result.time;
            Notify.success(t('setting.refresh-now-success.label'));
          } else {
            Notify.error(result.message)
          }
        });
        Notify.success(t('setting.refresh-now-msg-sent.label'));
      } else {
        Notify.error(t('setting.error.native-app-not-ready'));
      }
    });
  }


  function initSidebar(){
    const sidebar = T.queryElem('.sidebar');
    T.bind(sidebar, 'click', function(e){
      const elem = e.target;
      if(elem.className.indexOf('menu') > -1) {
        T.each(elem.parentNode.children, (menu) => {
          menu.classList.remove('active');
        });
        elem.classList.add('active');
      }
    });
  }

  function init(){
    renderUi();
    initUI();
    initSidebar();
  }

  init();
})();
