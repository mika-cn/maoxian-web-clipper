
"use strict";

// http://kb.mozillazine.org/Firefox_:_Issues_:_Links_to_Local_Pages_Don%27t_Work
(function(){

  function renderUi() {
    const elem = T.queryElem(".main");
    elem.innerHTML = MxWcTemplate.settingPage.render({
      settingFileUrlLink: MxWcLink.get('faq-allow-access-file-urls'),
      host: window.location.origin
    });
  }

  function initUI() {
    MxWcConfig.load().then((config) => {
      initSettingFormat(config);
      initSettingPath(config);
      initSettingClippingContent(config)
      initFileSchemeAccess(config);
      initSettingHotkey(config);
    });
  }

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
  }

  // section: clipping content
  function initSettingClippingContent(config) {
    initCheckboxInput(config,
      'save-clipping-information',
      'saveClippingInformation'
    );
    initCheckboxInput(config,
      'save-domain-as-tag',
      'saveDomainAsTag'
    );
  }

  function initSettingHotkey(config){
    initCheckboxInput(config,
      'enable-switch-hotkey',
      'enableSwitchHotkey',
    );
  }


  // section: format
  function initSettingFormat(config){
    iterateFormatBtn(function(elem){
      T.bindOnce(elem, 'click', clickFormatBtn);
      const elemFormat = elem.getAttribute('data-id');
      if(config.saveFormat == elemFormat){
        elem.classList.add('active');
      }
    });
  }
  function clickFormatBtn(e){
    iterateFormatBtn(function(elem){
      elem.classList.remove('active');
    });
    const elem = e.target;
    const format = elem.getAttribute('data-id');
    elem.classList.add('active');
    MxWcConfig.update('saveFormat', format);
  }
  function iterateFormatBtn(fn){
    T.each(T.queryElems(".setting-format > a"), fn);
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
      MxWcConfig.update(configKey, e.target.value);
    });
  }

  function init(){
    renderUi();
    initUI();
  }

  init();
})();
