"use strict";
(function(){
  const state = {};

  function menuClick(e){
    const menu = e.target;
    switch(menu.getAttribute('data-id')){
      case 'clip': startClip(); break;
      case 'history': jumpToPage('extPage.history'); break;
      case 'setting': jumpToPage('extPage.setting'); break;
      case 'home'   : jumpToPage('home'); break;
      case 'last-result':viewLastResult(); break;
      default: break;
    }
  }

  function closeWindow(){ window.close() }

  function viewLastResult(){
    MxWcStorage.set('lastDownloadItemId', null);
    ExtApi.openDownloadItem(state.lastDownloadItemId);
    state.lastDownloadItemId = null;
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

      if(tabUrl.startsWith('file:') || tabUrl.indexOf(MxWcLink.extensionRoot) > -1){
        pageIds.forEach(function(pageId){
          const extPagePath = MxWcLink.getExtensionPagePath(pageId);
          if(tabUrl.indexOf(extPagePath) == -1){
            menuIds.push(pageId);
          }
        })
      }else{
        menuIds = ['clip'].concat(pageIds);
      }
      menuIds.push('home');
      MxWcStorage.get('lastDownloadItemId')
        .then((downloadItemId) => {
          if(downloadItemId){
            state.lastDownloadItemId = downloadItemId;
            menuIds.unshift('last-result');
          }
          const html = MxWcTemplate.popupPageMenus.render({menuIds: menuIds});
          T.queryElem('.menus').innerHTML = html;
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
