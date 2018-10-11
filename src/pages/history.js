"use strict";

(function(){
  const state = {
    currClips: []
  };

  function showHistory(){
    searchAction();
  }

  function showClip(e){
    const tr = e.target.parentElement;
    const id = tr.getAttribute('data-id');
    const clip =  T.detect(state.currClips, (clip) => { return clip.clipId == id });
    if(clip){
      Promise.all([
        MxWcStorage.get('downloadFold'),
        MxWcConfig.load(),
        ExtApi.isAllowedFileSchemeAccess()
      ]).then((values) => {
        const [downloadFold, config, allowFileSchemeAccess] = values;
        const allowFileScheme = (allowFileSchemeAccess || config.allowFileSchemeAccess);
        let filename = clip.filename ? clip.filename : `index.${clip.format}`;
        const clipPath = clip.path.replace('index.json', filename);
        let url = clipPath;
        if(downloadFold){
          url = "file://" + [downloadFold, url].join('');
        }
        if(downloadFold && allowFileScheme){
          renderClipDetailModel_openUrlDirectly(clip, url);
        }else{
          ExtApi.findDownloadItemByPath(clipPath)
            .then((downloadItem) => {
              if(downloadItem){
                renderClipDetailModel_openUrlByDownloadItem(clip, url, downloadItem);
              }else{
                renderClipDetailModel_openUrlByCopyAndPaste(clip, url);
              }
            })
        }
      });
    }
  }

  // Although user allow extension access to file URLs,
  // Place "file URL" in link's href attribute will raise "Not allowed to load local resource"
  // open link through create new tab.
  function renderClipDetailModel_openUrlDirectly(clip, url){
    Log.debug('directly');
    const modal = T.queryElem('.modal');
    const modalContent = T.queryElem('.modal .content');
    modalContent.innerHTML = MxWcTemplate.historyPageClipDetail.render({
      urlAction: 'openUrlDirectly',
      clip: clip,
      url: url
    })
    modal.style.display = 'block';
    const elem = T.queryElem('.modal .content .path-link');
    T.bind(elem, 'click', function(){
      modal.style.display = 'none';
      ExtApi.createTab(url);
    })
  }

  // If download item is still in browser's download history,
  // we can use extension api to open download item.
  function renderClipDetailModel_openUrlByDownloadItem(clip, url, downloadItem){
    Log.debug('by download item');
    const modal = T.queryElem('.modal');
    const modalContent = T.queryElem('.modal .content');
    modalContent.innerHTML = MxWcTemplate.historyPageClipDetail.render({
      urlAction: 'openUrlByDownloadItem',
      clip: clip,
      url: url,
      downloadItem: downloadItem
    })
    modal.style.display = 'block';
    const elem = T.queryElem('.modal .content .path-link');
    T.bind(elem, 'click', function(){
      modal.style.display = 'none';
      ExtApi.openDownloadItem(downloadItem.id);
    })
  }

  // Worst situation
  // Help user to copy file URL :(
  function renderClipDetailModel_openUrlByCopyAndPaste(clip, url){
    const modal = T.queryElem('.modal');
    const modalContent = T.queryElem('.modal .content');
    modalContent.innerHTML = MxWcTemplate.historyPageClipDetail.render({
      urlAction: 'openUrlByCopyAndPaste',
      clip: clip,
      url: url
    })
    modal.style.display = 'block';
    const elem = T.queryElem('.modal .content .path');
    T.bind(elem, 'mouseover', function(e){ this.select() });
    elem.select();
  }

  function renderClips(clips){
    state.currClips = clips;
    const html = MxWcTemplate.historyPageClips.render({clips: clips});
    T.queryElem('.history').innerHTML = html;
    bindClipListener();
  }

  function bindClipListener(){
    const tbody = T.queryElem(".history > table > tbody");
    if(tbody) {
      T.bindOnce(tbody, 'click', showClip, true);
    }
  }

  function initSearch(){
    const v = { inputId: 'search', btnId: 'search-btn' };
    const searchBox = T.queryElem('.search-box');
    searchBox.innerHTML = MxWcTemplate.historyPageSearchFields.render(v)
    const input = T.findElem(v.inputId);
    const btn = T.findElem(v.btnId);
    input.value = getKeyword();
    T.bindOnce(input, 'keypress', searchInputListener);
    T.bindOnce(btn, 'click', searchAction);
  }

  function searchInputListener(e){
    if(e.keyCode === 13){
      searchAction();
    }
  }

  function getKeyword(){
    return window.localStorage.getItem('search.keyword');
  }

  function storeKeyword(value){
    window.localStorage.setItem('search.keyword', value);
  }

  function searchAction(){
    const input = T.findElem('search');
    const keyword = input.value.trim();
    storeKeyword(keyword);
    if(keyword == ""){
      MxWcStorage.get('clips', []).then(renderClips);
    }else{
      MxWcStorage.get('clips', []).then((clips) => {
        const regExp = new RegExp(keyword, 'i');
        const r = []
        T.each(clips, function(clip){
          let keep = true;
          if(keep && clip.title.match(regExp)){
            keep = false;
            r.push(clip)
          }
          if(keep && clip.category.match(regExp)){
            keep = false;
            r.push(clip)
          }
          if(keep){
            const tag = clip.tags.some(function(tag){
              if(tag.match(regExp)){
                return true
              }else{
                return false
              }
            })
            if(tag){ r.push(clip); }
          }
        });
        renderClips(r);
      });
    }
  }

  function initActions(){
    const elem = T.queryElem(".actions");
    const actions = [
      {name: t('history.a.reset_history'), pageName: "extPage.reset-history" }
    ]
    actions.forEach((action) => {
      const a = document.createElement("a");
      a.href = MxWcLink.get(action.pageName);
      a.target = '_blank';
      a.innerHTML = action.name;
      elem.appendChild(a);
    })
  }

  function initModal(){
    const elem = T.queryElem('.modal .mask');
    T.bindOnce(elem, 'click', hideModal);
    T.bind(document, 'keydown', function(e){
      if(e.keyCode === 27){
        hideModal();
      }
    });
    const content = T.queryElem('.modal .content');
    T.bind(content, 'click', function(e){
      e.stopPropagation();
    })

  }

  function hideModal(){
    const modal = T.queryElem('.modal');
    modal.style.display = 'none';
  }

  function init(){
    initSearch();
    initActions();
    initModal();
    showHistory();
  }

  init();
})();
