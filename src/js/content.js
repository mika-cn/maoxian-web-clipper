(function(){

  const ID_BTN           = 'MX-wc-btn';
  const ID_ENTRY         = 'MX-wc-entry';
  const CLASS_STATE_BAR  = 'MX-wc-bar';
  const CLASS_ENTRY      = 'MX-wc-entry';
  const CLASS_HINT       = 'MX-wc-hint';
  const CLASS_SELECTING  = 'MX-wc-selecting';
  const CLASS_SELECTED   = 'MX-wc-selected';

  const ID_TITLE         = "MX-wc-title";
  const ID_CATEGORY      = "MX-wc-category";
  const ID_TAGSTR        = "MX-wc-tagstr";
  const CLASS_FORM       = "MX-wc-form";
  const CLASS_SAVE_BTN   = 'MX-wc-save-button';
  const CLASS_CANCEL_BTN = 'MX-wc-cancel-button';

  const INPUT_TAG_NAMES = ['INPUT', 'TEXTAREA']


  function enable(ignore_guess){
    setStateSelecting();
    bindListener();
    if(!ignore_guess){
      //TODO Do we really need this..
      // guessMainContent();
    }
  }

  function disable(){
    setStateIdle();
    hideForm();
    unbindListener();
  }


  // TODO refactor this
  function guessMainContent(){
    const articles = T.queryElems('article');
    if(articles.length == 1){
      selectedTarget(articles[0]);
    }
  }


  function bindListener(){
    T.bind(document, 'mouseover', mouseOverHandler);
    T.bind(document, 'mouseout', mouseOutHandler);
    T.bind(document, 'keydown', keyDownHandler, true);
  };

  function unbindListener(){
    T.unbind(document, 'mouseover', mouseOverHandler);
    T.unbind(document, 'mouseout', mouseOutHandler);
    T.unbind(document, 'keydown', keyDownHandler, true);
    leave(getSelectingElement());
    switchSelected(getSelectedElement(), null);
  };


  function mouseOverHandler(e){
    leave(e.relatedTarget);
    hover(e.target);
  }

  function mouseOutHandler(e){
    leave(e.target);
  }

  function keyDownHandler(e){
    if(!INPUT_TAG_NAMES.includes(e.target.tagName)){
      switch(e.keyCode){
        case 27 : pressEsc(e)   ; break ;
        case 13 : pressEnter(e) ; break ;
        case 37 : pressLeft(e)  ; break ;
        case 38 : pressUp(e)    ; break ;
        case 39 : pressRight(e) ; break ;
        case 40 : pressDown(e)  ; break ;
        default: break;
      }
    }
  }

  function pressEsc(e){
    if(getSelectedElement()){
      Log.debug('back');
      // 选中状态, 退回可选择状态
      stopEvent(e);
      disable();
      enable(true);
      return;
    }
    if(getStateBar().classList.contains('selecting')){
      stopEvent(e);
      disable();
      removeUI();
    }
  }

  function pressEnter(e){
    const elem = getSelectedElement();
    if(elem){
      // 如果此时，页面上focus的是一个<a>元素，将发生跳转
      // fixed
      // See: https://www.w3.org/TR/uievents/#event-flow
      // interrupt propagation(include:  Capture Phase and Bubbling Phase)
      if(showForm()){
        stopEvent(e);
      }
    }
  }


  function showForm(){
    const form = T.firstElem(CLASS_FORM);
    if(form.style.display == 'block'){ return false}
    setStateConfirmed();
    form.style.display = 'block';
    const titleInput = T.findElem(ID_TITLE);
    const categoryInput = T.findElem(ID_CATEGORY);
    const tagstrInput = T.findElem(ID_TAGSTR);


    titleInput.value = document.title;
    categoryInput.value='';
    tagstrInput.value = '';
    MxWc.form.clearAutoComplete();
    MxWcStorage.get('categories', [])
      .then((v) => {
        MxWc.form.categoryAutoComplete = new Lib.Awesomplete(categoryInput, {
          autoFirst: true,
          minChars: 1,
          list: v
        })
        categoryInput.focus();
      })
    MxWcStorage.get('tags', [])
      .then((v) => {
        MxWc.form.tagstrAutoComplete =  new Lib.Awesomplete(tagstrInput, {
          autoFirst: true,
          minChars: 1,
          list: v,
          filter: function(text, input) {
            return Lib.Awesomplete.FILTER_CONTAINS(text, input.match(/[^ ,，]*$/)[0]);
          },

          item: function(text, input) {
            return Lib.Awesomplete.ITEM(text, input.match(/[^ ,，]*$/)[0]);
          },

          replace: function(text) {
            const before = this.input.value.match(/^.+[ ,，]{1}\s*|/)[0];
            this.input.value = before + text + " ";
          }
        });
      })
    return true;
  }

  function hideForm(){
    T.firstElem(CLASS_FORM).style.display = 'none';
  }

  function pressLeft(e){
    const elem = getSelectedElement();
    if(!elem){ return; }
    const pElem = elem.parentElement;
    if(['HTML', 'BODY'].indexOf(pElem.tagName) < 0){
      MxWc.selector.stack.push(elem);
      stopEvent(e)
      switchSelected(elem, pElem);
    }
  }

  function stopEvent(e){
    e.stopPropagation();
    e.preventDefault();
  }

  function pressRight(e){
    const elem = getSelectedElement();
    if(!elem){ return; }
    if(MxWc.selector.stack.isEmpty()){
      let cElem = elem.children[0];
      while(cElem && isOnBlackList(cElem)){
        cElem = cElem.children[0];
      }
      if(cElem){
        MxWc.selector.clearStack();
        MxWc.selector.stack.push(cElem);
        stopEvent(e);
        switchSelected(elem, cElem);
      }
    }else{
      let cElem = MxWc.selector.stack.pop();
      stopEvent(e);
      switchSelected(elem, cElem);
    }
  }

  function pressUp(e){
    const elem = getSelectedElement();
    if(elem){
      let prevElem = elem.previousElementSibling;
      while(prevElem && isOnBlackList(prevElem)){
        prevElem = prevElem.previousElementSibling;
      }
      if(prevElem){
        MxWc.selector.clearStack();
        stopEvent(e);
        switchSelected(elem, prevElem);
      }
    }
  }


  function pressDown(e){
    const elem = getSelectedElement();
    if(elem){
      let nextElem = elem.nextElementSibling;
      while(nextElem && isOnBlackList(nextElem)){
        nextElem = nextElem.nextElementSibling;
      }
      if(nextElem){
        MxWc.selector.clearStack();
        stopEvent(e);
        switchSelected(elem, nextElem);
      }
    }
  }


  function isOnBlackList(elem){
    const blackList = ["SCRIPT", "STYLE", "TEMPLATE"];
    return (blackList.indexOf(elem.tagName) > -1
      || isUIElem(elem)
      || elem.getBoundingClientRect().height === 0
      || elem.innerText.trim().length === 0
    )
  }


  function clickSelectedArea(e){
    const elem = getSelectedElement();
    if(elem){
      stopEvent(e);
      toggleScrollY(elem);
      //showForm();
    }
  }

  function switchSelected(fromElem, toElem){
    if(fromElem){
      eraseSelectedStyle(fromElem);
      T.unbind(fromElem, 'click', clickSelectedArea, true);
    }
    if(toElem){
      drawSelectedStyle(toElem);
      T.bindOnce(toElem, 'click', clickSelectedArea, true);

      if(fromElem){
        // 根据前一个选中确认要滚动到顶部还是底部
        const box = fromElem.getBoundingClientRect();
        if(box.top >= 0){
          scrollToElem(toElem, 'top');
        }else{
          scrollToElem(toElem, 'bottom');
        }
      }else{
        scrollToElem(toElem, 'top');
      }
    }
  }

  function toggleScrollY(elem){
    const box = elem.getBoundingClientRect();
    const visibleHeight = window.innerHeight;
    if(box.top + box.height > visibleHeight){
      scrollToElem(elem, 'bottom');
    }else{
      scrollToElem(elem, 'top');
    }
  }

  /*
   * @param {string} mode - 'top' or 'bottom'
   */
  function scrollToElem(elem, mode){
    const box = elem.getBoundingClientRect();
    const x = window.scrollX + box.left;
    if(mode === 'top'){
      const y = window.scrollY + box.top;
      window.scrollTo(x, Math.max(0, y-120));
    }else{
      const y = window.scrollY + box.top + box.height;
      window.scrollTo(x, Math.max(0, y-400));
    }
  }

  function setStateIdle(){
    const bar = getStateBar();
    const btn = getEntryBtn();
    btn.title = t('switch.title');
    bar.classList.remove('selected');
    bar.classList.remove('selecting');
    bar.classList.remove('confirmed');
    bar.classList.remove('clipping');
    bar.classList.add('idle');
    hideHint();
  }
  function setStateSelecting(){
    const bar = getStateBar();
    const btn = getEntryBtn();
    btn.innerText = "ON";
    btn.title = t('switch.title');
    bar.classList.remove('idle');
    bar.classList.add('selecting');
    showHint(t('hint.selecting'));
  }
  function setStateSelected(){
    const bar = getStateBar();
    const btn = getEntryBtn();
    btn.innerText = "ON";
    btn.title = t('switch.title');
    bar.classList.remove('selecting');
    bar.classList.add('selected');
    showHint(t('hint.selected'));
  }
  function setStateConfirmed(){
    hideHint();
    const bar = getStateBar();
    bar.classList.remove('selecting');
    bar.classList.remove('selected');
    bar.classList.add('confirmed');
  }
  function setStateClipping(){
    hideHint();
    const bar = getStateBar();
    bar.classList.remove('confirmed');
    bar.classList.add('clipping');
    showHint(t('hint.downloading'));
  }

  function drawSelectingStyle(elem){
    elem.classList.add(CLASS_SELECTING);
    elem.style.boxShadow = "0 0 3px 3px red";
    elem.style.borderTop = "3px dashed red";
    elem.style.borderBottom = "3px dashed red";
  }
  function drawSelectedStyle(elem){
    elem.classList.add(CLASS_SELECTED);
    elem.style.boxShadow = "0 0 3px 3px green";
    elem.style.borderTop = "3px solid green";
    elem.style.borderBottom = "3px solid green";
  }
  function eraseSelectingStyle(elem){
    elem.classList.remove(CLASS_SELECTING);
    elem.style.boxShadow = "";
    elem.style.borderTop = "";
    elem.style.borderBottom = "";
  }
  function eraseSelectedStyle(elem){
    elem.classList.remove(CLASS_SELECTED);
    elem.style.boxShadow = "";
    elem.style.borderTop = "";
    elem.style.borderBottom = "";
  }

  const hover = function(element){
    if(element && !isUIElem(element)){
      drawSelectingStyle(element);
      T.bind(document, 'click', selectedByEvent, true);
    }
  };

  const leave = function(element){
    if(element && !isUIElem(element)){
      eraseSelectingStyle(element);
      T.unbind(document, 'click', selectedByEvent, true);
    }
  };

  const isUIElem = function(elem){
    return elem.classList.contains(CLASS_ENTRY);
  }

  const selectedTarget = function(target){
    unbindListener();
    switchSelected(null, target);
    MxWc.selector.clearStack();
    setStateSelected();
    T.bind(document, 'keydown', keyDownHandler, true);
  }

  const selectedByEvent = function(e){
    if(e.target.classList.contains(CLASS_SELECTING)){
      stopEvent(e);
      selectedTarget(e.target);
    }
  };

  const showHint = function(text){
    const elem = T.firstElem(CLASS_HINT);
    elem.innerHTML = text;
    elem.style.display = 'inline-block';
  }

  const hideHint = function(){
    const elem = T.firstElem(CLASS_HINT);
    elem.innerHTML = '-';
    elem.classList.remove('clickable');
    elem.style.display = 'none';
  }


  // Find Element
  const getStateBar = function(){
    return T.firstElem(CLASS_STATE_BAR);
  }
  const getEntryBtn = function(){
    return T.findElem(ID_BTN);
  }
  const getEntryUI = function(){
    return T.findElem(ID_ENTRY);
  }
  const getSelectingElement = function(){
    return T.firstElem(CLASS_SELECTING);
  }
  const getSelectedElement = function(){
    return T.firstElem(CLASS_SELECTED);
  }

  function renderUI(){
    return MxWcTemplate.UIHtml.render({
      g: CLASS_ENTRY,
      id: {
        btn      : ID_BTN,
        category : ID_CATEGORY,
        tagstr   : ID_TAGSTR,
        title    : ID_TITLE,
      },
      /* class */
      c: {
        hint   : CLASS_HINT,
        save   : CLASS_SAVE_BTN,
        cancel : CLASS_CANCEL_BTN,
      }
    });
  }

  function appendUI(){
    removeUI();
    const entry = document.createElement('div');
    entry.classList.add(CLASS_ENTRY);
    entry.id = ID_ENTRY;
    entry.innerHTML = renderUI();
    document.body.appendChild(entry);
    Log.debug("UI appended");
  }

  function removeUI(){
    const entry = getEntryUI();
    if(entry){
      document.body.removeChild(entry);
      Log.debug("UI removed");
    }
  }

  function saveForm(){
    const elem = getSelectedElement();
    if(elem){
      const titleInput = T.findElem(ID_TITLE);
      const title = titleInput.value;
      const categoryInput = T.findElem(ID_CATEGORY);
      const category = categoryInput.value;
      if(title.trim() === ""){
        title = 'default';
      }
      if(category.trim() === ""){
        category = 'default';
      }
      const tagstrInput = T.findElem(ID_TAGSTR);
      const tags = T.splitTagstr(tagstrInput.value);

      hideForm();
      unbindListener();
      setStateClipping();

      MxWcSave.save({
        title: title,
        category: category,
        tags: tags,
        elem: elem
      })

    }else{
      // 通知当前未有选择的元素？
    }
  }



  function cancelForm(){
    hideForm();
    disable();
    removeUI();
  }

  function initUI(){
    const btn = getEntryBtn();
    const saveBtn = T.firstElem(CLASS_SAVE_BTN);
    const cancelBtn = T.firstElem(CLASS_CANCEL_BTN);
    const tagstrInput = T.findElem(ID_TAGSTR);
    T.bindOnce(btn, 'click', entryClickHandler);

    // show help hint to new user.
    MxWcStorage.get('categories', [])
      .then((v) => {
        if(v.length == 0){
          const bar = getStateBar();
          bar.classList.add('new-user');
        }
      })

    T.bindOnce(saveBtn     , 'click'    , saveForm);
    T.bindOnce(cancelBtn   , 'click'    , cancelForm);
    T.bindOnce(saveBtn     , 'keypress' , formEnterKeyHandler);
    T.bindOnce(cancelBtn   , 'keypress' , formEnterKeyHandler);
    T.bindOnce(tagstrInput , 'keypress' , formEnterKeyHandler);
    disable();
  }

  function formEnterKeyHandler(e){
    if(e.keyCode === 13){
      e.preventDefault();
      if(e.target.classList.contains(CLASS_CANCEL_BTN)){
        cancelForm();
      }else{
        saveForm();
      }
    }
  }

  function entryClickHandler(e){
    const bar = getStateBar();
    if(bar && !bar.classList.contains('idle')){
      disable();
      removeUI();
    }else{
      appendUI();
      // TODO 为什么在追加节点后，改变类就会导致追加的节点，被移除。只有
      // 在www.bing.com 搜索结果页, 进行裁剪，追加的html后，立即又被删除了。
      // 初步追踪后，找到 setStateSelecting 里面的 bar.classList.remove, bar.classList.add 两句话会导致此情况发生。
      // 这里应该是一个特例，还是特殊情况下会出现，须进一步了解。
      // 如果进一步改成用 Iframe 来做UI，可以避免这种不确定?
      // 暂时通过 setTimeout 绕过, [这里还是绕不过，Awesomplete 也遇到这个问题]
      setTimeout(function(){
        initUI();
        enable();
        Log.debug("all initialized");
      }, 0)
    }
  }

  function downloadCompleted(){
    hideHint();
    disable();
    removeUI();
  }

  function listenMessage(){
    ExtApi.addMessageListener(function(msg){
      return new Promise(function(resolve, reject){
        switch(msg.type){
          case 'icon.click':
            window.focus();
            entryClickHandler({});
            break;
          case 'download.completed': downloadCompleted();break;
          case 'page_content.changed': pageContentChanged(); break;
          default: break;
        }
        resolve();
      });
    });
  }

  function pageContentChanged(){
    setTimeout(function(){
      Log.debug('page content changed');
      const bar = getStateBar();
      if(!bar){ return }
      if(bar.classList.contains('selected') && !getSelectedElement()
        || bar.classList.contains('selecting') && !getSelectingElement()){
          clearPageState();
          initialize();
      }
    }, 200);
  }

  const MxWc = {}
  MxWc.selector = {
    clearStack: function(){
      if(this.stack){
        this.stack.clear();
      }else{
        this.stack = T.createStack();
      }
    }
  }
  MxWc.form = {
    categoryAutoComplete: null,
    tagstrAutoComplete: null,
    clearAutoComplete: function(){
      if(this.categoryAutoComplete){
        this.categoryAutoComplete.destroy();
        this.categoryAutoComplete = null;
      }
      if(this.tagstrAutoComplete){
        this.tagstrAutoComplete.destroy();
        this.tagstrAutoComplete = null;
      }
    }
  }

  // https://bugzilla.mozilla.org/show_bug.cgi?id=1408996
  // save reference
  const Lib = {
    Awesomplete: window.Awesomplete
  }

  function toggleSwitch(e){
    if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey){ return }
    // 61 keyCode of 'c'
    if(e.keyCode == 67 && e.target.tagName === 'BODY'){
      entryClickHandler(e);
    }else{
      //console.log(e.target.tagName);
    }
  }

  function initialize(){
    T.bindOnce(document, "keydown", toggleSwitch);
    Log.debug("init...");
  }

  function run(){
    if(document){
      const xml = new XMLSerializer().serializeToString(document).trim();
      if(xml.match(/^<\?xml/i)){
        /* page is rss/atom ... */
      }else{
        initialize();
        listenMessage();
        listenPopState();
      }
    }
  }

  // clear page state due to page modification.
  function clearPageState(){
    Log.debug('clear page state');
    unbindListener();
    const elem1 = getSelectedElement();
    const elem2 = getSelectingElement();
    if(elem1){ eraseSelectedStyle(elem1)}
    if(elem2){ eraseSelectingStyle(elem2)}
    removeUI();
  }

  // user click browser's back/forword button or website PJAX
  function listenPopState(){
    window.onpopstate = function(e){
      clearPageState();
      setTimeout(initialize, 200);
    }
  }


  run();

})();
