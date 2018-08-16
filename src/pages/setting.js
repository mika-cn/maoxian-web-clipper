
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
      initSettingClippingContent(config)
      initFileSchemeAccess(config);
    });
  }

  // section: clipping content
  function initSettingClippingContent(config) {
    initCheckBoxInput(config,
      'save-clipping-information',
      'saveClippingInformation'
    );
    initCheckBoxInput(config,
      'save-domain-as-tag',
      'saveDomainAsTag'
    );
    initCheckBoxInput(config,
      'save-title-as-filename',
      'saveTitleAsFilename'
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
    initCheckBoxInput(config,
      'file-scheme-access-input',
      'allowFileSchemeAccess'
    );
  }

  function initCheckBoxInput(config, elemId, configKey){
    const elem = T.findElem(elemId);
    elem.checked = config[configKey];
    T.bind(elem, 'click', (e) => {
      MxWcConfig.update(configKey, e.target.checked);
    });
  }

  function init(){
    renderUi();
    initUI();
  }

  init();
})();
