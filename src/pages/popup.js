
import ENV         from '../js/env.js';
import T           from '../js/lib/tool.js';
import MxWcIcon    from '../js/lib/icon.js';
import I18N        from '../js/lib/translation.js';
import ExtApi      from '../js/lib/ext-api.js';
import ExtMsg      from '../js/lib/ext-msg.js';
import MxWcStorage from '../js/lib/storage.js';
import MxWcConfig  from '../js/lib/config.js'
import MxWcLink    from '../js/lib/link.js';

const state = {};

function menuClick(e){
  const menuId = getMenuId(e.target);
  switch(menuId){
    case 'clip-as-default': sendClipCommand('clip-as-default') ; break ;
    case 'clip-as-html'   : sendClipCommand('clip-as-html')    ; break ;
    case 'clip-as-md'     : sendClipCommand('clip-as-md')      ; break ;
    case 'history'  : jumpToPage('extPage.history') ; break ;
    case 'settings' : jumpToPage('extPage.setting') ; break ;
    case 'home'     : jumpToPage('extPage.home')    ; break ;
    case 'debug'    : jumpToPage('extPage.debug')   ; break ;
    case 'last-result':viewLastResult(); break;
    default: break;
  }
}

function getMenuId(evTarget) {
  if (evTarget.className === 'menus') { return null }
  if (evTarget.className === 'menu') {
    return evTarget.getAttribute('data-id');
  } else {
    return getMenuId(evTarget.parentElement);
  }
}

function closeWindow(){ window.close() }

function showError(errorMessage) {
  const error = T.queryElem('.error');
  error.innerText = errorMessage;
  error.classList.add('actived');
}

// can't do user action in promise, lead to (xxx may only be called from a user input handler)
function viewLastResult(){
  const {url, downloadItemId, failedTaskNum} = state.lastClippingResult;
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
    if(url.startsWith('http') || state.allowFileUrlAccess) {
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


function sendClipCommand(command) {
  const body = {command}
  ExtMsg.sendToBackground({
    type: 'popup-menu.clip-command',
    body: body
  }).then(closeWindow, showError);
}


function jumpToPage(page){
  ExtApi.createTab(MxWcLink.get(page));
  closeWindow();
}

async function renderMenus(){
  const config = await MxWcConfig.load();
  const pageIds = ['history', 'settings'];

  let menuIds = [];
  let tab;

  try { tab = await ExtApi.getCurrentTab(); } catch(e) {}

  if (tab) {
    const tabUrl = tab.url;

    if (T.isFileUrl(tabUrl) ||
       T.isBrowserExtensionUrl(tabUrl) ||
       T.isBrowserUrl(tabUrl)){
      pageIds.forEach(function(pageId) {
        const extPagePath = MxWcLink.getExtensionPagePath(pageId);
        if (tabUrl.indexOf(extPagePath) == -1) {
          menuIds.push(pageId);
        }
      })
    } else {
      //browser restricted url
      if (['addons.mozilla.org', 'chrome.google.com'].indexOf((new URL(tabUrl)).host) > -1) {
        menuIds = pageIds;
      } else if (config.selectSaveFormatOnMenus) {
        menuIds = ['clip-as-html', 'clip-as-md'].concat(pageIds);
      } else {
        menuIds = ['clip-as-default'].concat(pageIds);
      }
    }
  } else {
    menuIds = [...pageIds];
  }

  menuIds.push('home');

  if (ENV.isDev) {
    menuIds.push('debug');
  }

  const allowFileSchemeAccess = await ExtApi.isAllowedFileSchemeAccess();
  const lastClippingResult = await MxWcStorage.get('lastClippingResult');
  state.allowFileUrlAccess = (allowFileSchemeAccess || config.allowFileSchemeAccess);
  state.config = config;


  if(lastClippingResult){
    // Browser will erase download records when user restart it.
    if (lastClippingResult.downloadItemId) {
      const downloadItem = await ExtApi.findDownloadItem(lastClippingResult.downloadItemId);
      if (downloadItem) {
        state.lastClippingResult = lastClippingResult;
        menuIds.unshift('last-result');
      } else {
        MxWcStorage.set('lastClippingResult', null);
      }
    } else {
      state.lastClippingResult = lastClippingResult;
      menuIds.unshift('last-result');
    }
  }

  const menus = T.queryElem('.menus');
  menus.classList.add(...menuIds);
  bindListener(menus);
}

function bindListener(menus){
  T.bindOnce(menus, 'click', menuClick, true);
}


async function init(){
  I18N.i18nPage();
  await renderMenus();
  MxWcIcon.change("default");
}

document.addEventListener("DOMContentLoaded", init);
