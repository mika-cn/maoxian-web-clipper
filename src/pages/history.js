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
    const html = renderClipDetail({
      urlAction: 'openUrlDirectly',
      clip: clip,
      url: url
    });
    T.setHtml(modalContent, html);
    i18nPage();
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
    const html = renderClipDetail({
      urlAction: 'openUrlByDownloadItem',
      clip: clip,
      url: url,
      downloadItem: downloadItem
    });
    T.setHtml(modalContent, html);
    i18nPage();
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
    const html = renderClipDetail({
      urlAction: 'openUrlByCopyAndPaste',
      clip: clip,
      url: url
    });
    T.setHtml(modalContent, html);
    i18nPage();
    modal.style.display = 'block';
    const elem = T.queryElem('.modal .content .path');
    T.bind(elem, 'mouseover', function(e){ this.select() });
    elem.select();
  }

  function renderClipDetail(v) {
    const template = T.findElem('modal-content-tpl').innerHTML;
    let clipPath = "";
    switch(v.urlAction){
      case 'openUrlDirectly':
      case 'openUrlByDownloadItem':
        clipPath = `<a class="path-link" href="">${v.url}</a>`;
        break;
      case 'openUrlByCopyAndPaste':
        clipPath =`<input type="text" class='path' readonly="true" value="${v.url}" />`;
        break;
    }
    return T.renderTemplate(template, {
      title: v.clip.title,
      clipPath: clipPath,
      createdAt: v.clip.created_at,
      category: v.clip.category,
      tags: v.clip.tags.join(", "),
      format: v.clip.format
    });
  }


  function renderClips(clips){
    state.currClips = clips;

    const list = T.queryElem('.list');
    const hint = T.queryElem('.no-record');
    list.style.display = 'none';
    hint.style.display = 'none';
    if(clips.length > 0) {
      const trowTpl  = T.findElem('trow-tpl').innerHTML;
      const items = [];
      clips.forEach(function(clip){
        items.push(T.renderTemplate(trowTpl, {
          clipId: clip.clipId,
          time: renderTime(clip),
          category: clip.category,
          tags: clip.tags.join(", "),
          title: clip.title
        }));
      });
      T.setHtml('.clippings > tbody', items.join(''));
      list.style.display = 'block';
    } else {
      hint.style.display = 'block';
    }
    bindClipListener();
  }

  function renderTime(clip) {
    try{
      const d = new Date(clip.created_at)
      const t = T.wrapDate(d).str;
      return [t.month, t.day].join('/')
    }catch(e) {
      return '-/-'
    }
  }

  function bindClipListener(){
    const tbody = T.queryElem(".list > table > tbody");
    if(tbody) {
      T.bindOnce(tbody, 'click', showClip, true);
    }
  }

  function initSearch(){
    const input = T.findElem('search');
    const btn = T.findElem('search-btn');
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

  function clearHistory(e){
    MxWcStorage.set('clips', [])
    renderClips([]);
  }

  function initLinks(){
    const elem = T.queryElem(".links");
    const actions = [
      {name: t('history.a.reset_history'), pageName: "extPage.reset-history" }
    ]
    actions.forEach((action) => {
      const a = document.createElement("a");
      a.href = MxWcLink.get(action.pageName);
      a.target = '_blank';
      a.innerText = action.name;
      elem.appendChild(a);
    })
  }

  function initActions(){
    const btn = T.findElem('clear-history');
    T.bindOnce(btn, 'click', clearHistory);
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

  function recallScroll(){
    window.addEventListener('unload', function(e){
      window.localStorage.setItem('scrollY', window.scrollY);
    })
    setTimeout(function(){
      let scrollY = window.localStorage.getItem('scrollY')
      if(scrollY){
        scrollY = parseInt(scrollY);
        console.log(scrollY);
        if(scrollY > 150){
          window.scrollTo(0, parseInt(scrollY));
        }
      }
    }, 0);
  }

  function init(){
    initSearch();
    initLinks();
    initActions();
    initModal();
    i18nPage();
    showHistory();
    recallScroll();
  }

  init();
})();
