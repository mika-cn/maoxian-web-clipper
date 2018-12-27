
"use strict";

// http://kb.mozillazine.org/Firefox_:_Issues_:_Links_to_Local_Pages_Don%27t_Work
(function(){

  function renderUi() {
    const template = T.findElem('setting-page-tpl').innerHTML;
    let lastGenerateTime = t('setting.not-generated-yet.label');
    MxWcStorage.get('lastGenerateTime').then((v) => {
      if(v){
        lastGenerateTime = v
      }
      const html = T.renderTemplate(template, {
        settingFileUrlLink: MxWcLink.get('faq-allow-access-file-urls'),
        nativeAppUrl: MxWcLink.get('native-app'),
        offlinePageIntro: MxWcLink.get('offline-page'),
        lastGenerateTime: lastGenerateTime,
        host: window.location.origin
      });
      T.setHtml('.main', html);
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
    });
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
        Notify.add(t('op.update-success'));
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
    bindButtonListener('generate-now', generateNow);
  }

  function bindButtonListener(id, handler){
    const btn = T.findElem(id);
    T.bindOnce(btn, 'click', handler);
  }

  /* button click handlers */

  function generateNow(e){
    ExtApi.sendMessageToBackground({type: 'generate.clipping.js'});
    const time = T.currentTime().toString();
    const label = T.findElem('last-generate-time');
    label.innerHTML = time;
    Notify.add(t('setting.generate-now-msg-sent.label'));
  }

  function init(){
    renderUi();
    initUI();
  }

  init();
})();
