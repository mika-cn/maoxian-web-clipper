;"use strict";

(function(Config){

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
      const template = T.findElem('clipping-tpl').innerHTML;
      const items = [];
      clips.forEach(function(clip){
        const jsonUrl = calcRelativePath(clip.path);
        let filename = clip.filename;
        if(!filename) {
          filename = ['index', clip.format].join('.');
        }
        const  url = jsonUrl.replace('index.json', filename);
        items.push(T.renderTemplate(template, {
          clipId: clip.clipId,
          time: renderTime(clip),
          category: clip.category,
          tags: renderTags(clip),
          title: T.escapeHtml(clip.title),
          url: url
        }));
      });
      T.setHtml('.clippings', items.join(''));
      list.style.display = 'block';
    } else {
      hint.style.display = 'block';
    }
  }

  function calcRelativePath(clippingPath){
    const path = window.location.pathname;
    const ridx = path.lastIndexOf('/');
    let dir = path.substring(0, ridx);
    let idx = dir.indexOf(Config.rootFolder)
    if( idx > -1) {
      dir = dir.substring(idx + Config.rootFolder.length);
    }
    const currDir = [Config.rootFolder, dir].join('');
    return T.calcPath(currDir, clippingPath);
  }

  function renderTags(clip) {
    return clip.tags.map((tag) => {
      return `<code>${tag}</code>`;
    }).join('');
  }

  function renderTime(clip) {
    try{
      const d = new Date(clip.created_at)
      const t = T.wrapDate(d).str;
      return [t.year, t.month, t.day].join('-');
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

  function searchAction(e){
    if(e) { e.preventDefault()}
    const input = T.findElem('search');
    const keyword = input.value.trim();
    storeKeyword(keyword);
    let q = {};
    if(keyword !== "") {
      const regExp = new RegExp(keyword, 'i');
      q = {
        __logic__: 'OR',
        title: ['match', regExp],
        category: ['match', regExp],
        tags: ['memberMatch', regExp]
      }
    }
    const clips = Query.queryObj(clippings, q);
    renderClips(clips);
  }

  function init(){
    initSearch();
    showHistory();
  }

  init();
})(Config);
