;"use strict";

(function(){

  const state = {
    currClips: []
  };

  function showHistory(){
    searchAction();
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
        const jsonUrl = calcRelativePath(clip.path);
        let filename = clip.filename;
        if(!filename) {
          filename = ['index', clip.format].join('.');
        }
        const  url = jsonUrl.replace('index.json', filename);
        items.push(T.renderTemplate(trowTpl, {
          clipId: clip.clipId,
          time: renderTime(clip),
          category: clip.category,
          tags: clip.tags.join(", "),
          title: clip.title,
          url: url
        }));
      });
      T.setHtml('.clippings > tbody', items.join(''));
      list.style.display = 'block';
    } else {
      hint.style.display = 'block';
    }
  }

  function calcRelativePath(clippingPath){
    const root = 'mx-wc';
    const path = window.location.href;
    const ridx = path.lastIndexOf('/');
    const dir = path.substring(0, ridx);
    const currDir = [root, dir.split(root)[1]].join('');
    return T.calcPath(currDir, clippingPath);
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
      renderClips(clippings);
    }else{
      const regExp = new RegExp(keyword, 'i');
      const r = []
      clippings.forEach(function(clip){
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
    }
  }

  function recallScroll(){
    window.addEventListener('unload', function(e){
      window.localStorage.setItem('scrollY', window.scrollY);
    })
    setTimeout(function(){
      let scrollY = window.localStorage.getItem('scrollY')
      if(scrollY){
        scrollY = parseInt(scrollY);
        if(scrollY > 150){
          window.scrollTo(0, parseInt(scrollY));
        }
      }
    }, 0);
  }

  function init(){
    initSearch();
    showHistory();
    recallScroll();
  }

  init();
})();
