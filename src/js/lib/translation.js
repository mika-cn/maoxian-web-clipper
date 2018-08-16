
"use strict";
this.t = (function(I18N_DICT, locale) {
  function initTranslate(locale){
    const dict = I18N_DICT[locale]
    if(dict){
      i18n.translator.add(dict);
    }else{
      initTranslate('en');
    }
  }
  //initTranslate('zh-CN' || locale);
  initTranslate(locale);

  return (function(key) {
    return i18n(key);
  });
})(I18N_DICT, browser.i18n.getUILanguage());
