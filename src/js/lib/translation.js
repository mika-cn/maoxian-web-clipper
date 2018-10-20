
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
  initTranslate(ExtApi.locale);

  return (function(key) {
    return i18n(key);
  });
})(I18N_DICT, ExtApi);

this.i18nPage = function(){
  const iterate = function(attr, action) {
    [].forEach.call(document.querySelectorAll('['+attr+']'), function(elem){
      const value = elem.getAttribute(attr);
      action(elem, value)
    });
  }
  iterate('i18n', function(elem, value) {
    if(elem.innerHTML === '' && value) {
      elem.innerHTML = t(value);
    }
  });
  iterate('i18n-attr', function(elem, value) {
    const [attr, key] = value.split(':');
    elem.setAttribute(attr, t(key));
  });
}
