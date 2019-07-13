"use strict";
(function(){
  const state = {};

  function menuClick(e){
    const menu = e.target;
    switch(menu.getAttribute('data-id')){
      case 'clip': startClip(); break;
      case 'history': jumpToPage('extPage.history'); break;
      case 'setting': jumpToPage('extPage.setting'); break;
      case 'home'   : jumpToPage('extPage.home'); break;
      case 'last-result':viewLastResult(); break;
      default: break;
    }
  }

  function closeWindow(){ window.close() }

  // can't do user action in promise, lead to (xxx may only be called from a user input handler)
  function viewLastResult(){
    const {filename, downloadItemId, failedTaskNum} = state.lastClippingResult;
    if(failedTaskNum > 0) {
      jumpToPage('extPage.last-clipping-result');
      return;
    }
    if(downloadItemId) {
      // clipping saved by browser download.
      MxWcStorage.set('lastClippingResult', null);
      state.lastClippingResult = null;
      ExtApi.openDownloadItem(downloadItemId);
    } else {
      let url = '';
      if(filename.startsWith('http') || filename.startsWith('file')) {
        // http://...,https://... or file://...
        url = filename;
      } else {
        url = 'file://' + filename;
      }
      if(url.startsWith('http') || state.isAllowFileScheme) {
        MxWcStorage.set('lastClippingResult', null);
        state.lastClippingResult = null;
        ExtApi.createTab(url);
      } else {
        // We can't open file url without allowed.
        jumpToPage('extPage.last-clipping-result');
      }
    }
    closeWindow();
  }

  function startClip(){
    ExtApi.sendMessageToContent({type: 'icon.click'}).then(closeWindow);
  }

  function jumpToPage(page){
    ExtApi.createTab(MxWcLink.get(page));
    closeWindow();
  }

  function renderMenus(){
    ExtApi.getCurrentTab().then((tab) => {
      const tabUrl = tab.url;
      const pageIds = ['history', 'setting'];
      let menuIds = [];

      if(T.isFileUrl(tabUrl) ||
         T.isExtensionUrl(tabUrl) ||
         T.isBrowserUrl(tabUrl)){
        pageIds.forEach(function(pageId){
          const extPagePath = MxWcLink.getExtensionPagePath(pageId);
          if(tabUrl.indexOf(extPagePath) == -1){
            menuIds.push(pageId);
          }
        })
      }else{
        //browser restricted url
        if(['addons.mozilla.org', 'chrome.google.com'].indexOf((new URL(tabUrl)).host) > -1) {
          menuIds = pageIds;
        } else {
          menuIds = ['clip'].concat(pageIds);
        }
      }
      menuIds.push('home');
      Promise.all([
        MxWcConfig.load(),
        ExtApi.isAllowedFileSchemeAccess(),
        MxWcStorage.get('lastClippingResult')
      ]).then((values) => {
        const [config, allowFileSchemeAccess, lastClippingResult] = values;
        state.isAllowFileScheme = (allowFileSchemeAccess || config.allowFileSchemeAccess);
        state.config = config;

        if(lastClippingResult){
          state.lastClippingResult = lastClippingResult;
          menuIds.unshift('last-result');
        }
        const template = T.findElem('menu-tpl').innerHTML;

        const icons = {
          "last-result" : '&#9215;',
          "clip"        : '&#9984;',
          "history"     : '&#9780;',
          "setting"     : '&#9965;',
          "home"        : '&#9961;',
        }
        // 9215 ⏿
        // 9984 ✀
        // 9780 ☴
        // 9776 ☰
        // 9965 ⛭
        // 9961 ⛩

        let html = "";
        menuIds.forEach(function(menuId){
          const appendClass = (menuId == 'last-result' ? ' active' : '');
          html += T.renderTemplate(template, {
            icon: icons[menuId],
            iconAppendClass: appendClass,
            menuId: menuId,
            menuContent: t("popup.menu." + menuId),
          });
        });
        T.setHtml('.menus', html);
        bindListener();
      })

    })
  }

  function bindListener(){
    const menus = document.querySelectorAll(".menu");
    menus.forEach(function(menu){
      T.bindOnce(menu, 'click', menuClick);
    });
  }


  function init(){
    renderMenus();
    MxWcIcon.change("default");
  }

  document.addEventListener("DOMContentLoaded", init);

})();
