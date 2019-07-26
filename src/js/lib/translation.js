
(function(win, I18N_DICT, ExtApi, T) {
  "use strict";

  function initTranslate(locale){
    const dict = I18N_DICT[locale]
    if(dict){
      i18n.translator.add(dict);
    }else{
      initTranslate('en');
    }
  }
  initTranslate(ExtApi.locale);

  //
  // all parts will join by '.'
  //
  // Usage:
  //   t(key)
  //   t(keyPart1, keyPart2, ..keyPartN)
  function t(...parts) {
    return i18n(parts.join('.'));
  }

  function i18nPage(contextNode){
    const iterate = function(attr, action) {
      [].forEach.call((contextNode || document).querySelectorAll('['+attr+']'), function(elem){
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

  function listen() {
    document.addEventListener('___.mx-wc.page.changed', function(e) {
      const detail = JSON.parse(e.detail);
      if(detail.selector !== '') {
        const contextNode = document.querySelector(detail.selector);
        i18nPage(contextNode);
      } else {
        i18nPage();
      }
    });
  }

  listen();
  win.t = t;
  win.i18nPage = i18nPage;

})(this, I18N_DICT, ExtApi, T);
