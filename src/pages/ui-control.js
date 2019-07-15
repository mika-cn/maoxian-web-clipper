
"use strict";
(function(){
  const ID = 'mx-wc-iframe-control';

  const ID_BTN           = 'MX-wc-btn';
  const ID_ENTRY         = 'MX-wc-entry';
  const CLASS_STATE_BAR  = 'MX-wc-bar';
  const CLASS_ENTRY      = 'MX-wc-entry';
  const CLASS_HINT       = 'MX-wc-hint';

  const ID_TITLE         = "MX-wc-title";
  const ID_FORMAT        = 'MX-wc-format';
  const ID_CATEGORY      = "MX-wc-category";
  const ID_TAGSTR        = "MX-wc-tagstr";
  const CLASS_FORM       = "MX-wc-form";
  const CLASS_SAVE_BTN   = 'MX-wc-save-button';
  const CLASS_CANCEL_BTN = 'MX-wc-cancel-button';
  const INPUT_TAG_NAMES = ['INPUT', 'TEXTAREA']

  function initUI(){
    const entryHtml = renderUI();
    const entry = document.createElement('div');
    entry.id = ID_ENTRY;
    entry.className = CLASS_ENTRY;
    entry.innerHTML = entryHtml;
    document.body.appendChild(entry);
    setTimeout(initUIListener, 0);
  }

  function initUIListener() {
    const btn = getEntryBtn();
    const saveBtn = T.firstElem(CLASS_SAVE_BTN);
    const cancelBtn = T.firstElem(CLASS_CANCEL_BTN);
    const tagstrInput = T.findElem(ID_TAGSTR);
    T.bindOnce(btn, 'click', entryClick);

    const bar = getStateBar();
    MxWcConfig.load().then((config) => {
      // "c" hotkey
      if(config.enableSwitchHotkey) {
        T.bindOnce(document, "keydown", toggleSwitch);
      }

      if(config.enableMouseMode) {
        bar.classList.add('mouse-friendly')
        const helperPanel = T.firstElem('MX-wc-help');
        helperPanel.classList.add('mouse-friendly');
        //bind kbd listener
        T.bindOnce(helperPanel, 'click', helperPanelClicked);
      }
    });

    // show help hint to new user.
    MxWcStorage.get('categories', [])
      .then((v) => {
        if(v.length == 0){
          bar.classList.add('new-user');
        }
      })

    T.bindOnce(saveBtn     , 'click'    , saveForm);
    T.bindOnce(cancelBtn   , 'click'    , cancelForm);
    T.bindOnce(saveBtn     , 'keypress' , formEnterKeyHandler);
    T.bindOnce(cancelBtn   , 'keypress' , formEnterKeyHandler);
    T.bindOnce(tagstrInput , 'keypress' , formEnterKeyHandler);


    window.focus();
  }

  function helperPanelClicked(e) {
    if(e.target.tagName === 'KBD') {
      const keyCode = parseInt(e.target.getAttribute('data-key-code'));
      sendKeyPressMessage(keyCode);
    }
  }

  function renderUI(){
    return MxWcTemplate.UIHtml.render({
      g: CLASS_ENTRY,
      id: {
        btn      : ID_BTN,
        format   : ID_FORMAT,
        category : ID_CATEGORY,
        tagstr   : ID_TAGSTR,
        title    : ID_TITLE,
      },
      /* class */
      c: {
        hint   : CLASS_HINT,
        save   : CLASS_SAVE_BTN,
        cancel : CLASS_CANCEL_BTN
      }
    });
  }

  function initFrameMsg(){
    const topWindowOrigin = atob(window.location.search.split('=')[1]);
    FrameMsg.init({
      id: ID,
      origin: window.location.origin,
      allowOrigins: [topWindowOrigin]
    });
  }

  function listenFrameMsg(){
    FrameMsg.addListener('bindListener', bindListener);
    FrameMsg.addListener('unbindListener', unbindListener);
    FrameMsg.addListener('unbindMouseMove', unbindMouseMove);
    FrameMsg.addListener('setStateIdle', setStateIdle);
    FrameMsg.addListener('setStateSelecting', setStateSelecting);
    FrameMsg.addListener('setStateSelected', setStateSelected);
    FrameMsg.addListener('setStateConfirmed', setStateConfirmed);
    FrameMsg.addListener('setStateClipping', setStateClipping);
    FrameMsg.addListener('setSavingStateStarted', setSavingStateStarted);
    FrameMsg.addListener('setSavingStateProgress', setSavingStateProgress);
    FrameMsg.addListener('setSavingStateCompleted', setSavingStateCompleted);
    FrameMsg.addListener('showForm', showForm);
    FrameMsg.addListener('hideForm', hideForm);
    FrameMsg.addListener('destroy', destroy);
  }

  /************** event listener ****************/

  function bindListener(msg) {
    T.bind(document, 'mousemove', mouseMoveHandler, true);
    T.bind(document, 'click', clickHandler, true);
    T.bind(document, 'keydown', keyDownHandler, true);
  };

  function unbindListener(msg) {
    unbindMouseMove();
    T.unbind(document, 'click', clickHandler, true);
    T.unbind(document, 'keydown', keyDownHandler, true);
  }

  function unbindMouseMove(msg){
    T.unbind(document, 'mousemove', mouseMoveHandler, true);
  }

  function mouseMoveHandler(e) {
    sendFrameMsgToTop('mousemove', {x: e.clientX, y: e.clientY});
  }

  function clickHandler(e) {
    if(['HTML', 'BODY'].indexOf(e.target.nodeName) > -1){
      sendFrameMsgToTop('click', {x: e.clientX, y: e.clientY});
    }
  }

  function keyDownHandler(e) {
    const keyCodes = [27, 13, 37, 46, 38, 39, 40];
    if(keyCodes.indexOf(e.keyCode) < 0) { return }
    if(!INPUT_TAG_NAMES.includes(e.target.tagName) && !e.target.classList.contains(CLASS_ENTRY)){
      sendKeyPressMessage(e.keyCode);
    }else{
      console.log(e.target.tagName);
      console.log(e.target);
    }
  }

  function sendKeyPressMessage(keyCode) {
    let type = null;
      switch(keyCode){
        case 27 : type = 'pressEsc'   ; break ;
        case 13 : type = 'pressEnter' ; break ;
        case 46 : type = 'pressDelete'; break ;
        case 37 : type = 'pressLeft'  ; break ;
        case 38 : type = 'pressUp'    ; break ;
        case 39 : type = 'pressRight' ; break ;
        case 40 : type = 'pressDown'  ; break ;
        /* custom keyCode :) */
        case -1001 : type = 'clickSelectedArea' ; break;
      }
      sendFrameMsgToTop(type);
  }

  function toggleSwitch(e){
    if(e.ctrlKey || e.metaKey || e.shiftKey || e.altKey){ return }
    // 67 keyCode of 'c'
    if(e.keyCode != 67){ return }
    if(e.target.tagName === 'BODY'){
      entryClick();
    }else{
      // console.log(e.target.tagName);
    }
  }

  function entryClick(){
    sendFrameMsgToTop('entryClick');
  }

  /************** change state ****************/

  function setStateIdle(msg){
    const bar = getStateBar();
    const btn = getEntryBtn();
    btn.title = t('switch.title');
    bar.classList.remove('selected');
    bar.classList.remove('selecting');
    bar.classList.remove('confirmed');
    bar.classList.remove('clipping');
    bar.classList.remove('saving');
    bar.classList.add('idle');
    hideHint();
  }
  function setStateSelecting(msg){
    const bar = getStateBar();
    const btn = getEntryBtn();
    btn.innerText = "ON";
    btn.title = t('switch.title');
    bar.classList.remove('idle');
    bar.classList.add('selecting');
    showHint(t('hint.selecting'));
  }
  function setStateSelected(msg){
    const bar = getStateBar();
    const btn = getEntryBtn();
    btn.innerText = "ON";
    btn.title = t('switch.title');
    bar.classList.remove('selecting');
    bar.classList.add('selected');
    showHint(t('hint.selected'));
  }
  function setStateConfirmed(msg){
    hideHint();
    const bar = getStateBar();
    bar.classList.remove('selecting');
    bar.classList.remove('selected');
    bar.classList.add('confirmed');
  }
  function setStateClipping(msg){
    hideHint();
    const bar = getStateBar();
    bar.classList.remove('confirmed');
    bar.classList.add('clipping');
    showHint(t('hint.clipping'));
  }

  /************** change saving state ****************/


  function setSavingStateStarted(msg) {
    const bar = getStateBar();
    bar.classList.remove('clipping');
    bar.classList.add('saving');
    showHint(t('hint.saving.started'));
  }

  function setSavingStateProgress(msg) {
    let hint = t('hint.saving.progress')
    hint = hint.replace('$finished', msg.finished).replace('$total', msg.total);
    showHint(hint);
  }

  function setSavingStateCompleted(msg) {
    showHint(t('hint.saving.completed'));
  }

  function showHint(text){
    const elem = T.firstElem(CLASS_HINT);
    elem.innerHTML = text;
    elem.style.display = 'inline-block';
  }

  function hideHint(){
    const elem = T.firstElem(CLASS_HINT);
    elem.innerHTML = '-';
    elem.classList.remove('clickable');
    elem.style.display = 'none';
  }

  /************** Form relative ****************/

  function formEnterKeyHandler(e){
    if(e.keyCode === 13){
      e.preventDefault();
      if(e.target.classList.contains(CLASS_CANCEL_BTN)){
        cancelForm();
      }else{
        saveForm();
      }
      stopEvent(e);
    }
  }

  async function initSaveFormatOption(formatOption) {
    const config = await MxWcConfig.load();
    T.bind(formatOption, 'click', (e) => {
      if(e.target.tagName === 'A'){
        const value = e.target.getAttribute('data-value');
        updateOptionsState(formatOption, value)
      }
    });
    updateOptionsState(formatOption, config["saveFormat"]);

    function updateOptionsState(elem, value) {
      T.each(elem.children, (option) => {
        option.classList.remove('active');
        const optionValue = option.getAttribute('data-value');
        if(optionValue === value){
          option.classList.add('active');
        }
      });
    }
  }

  async function showForm(msg){
    const form = T.firstElem(CLASS_FORM);
    if(form.style.display == 'block'){ return false}
    setStateConfirmed();
    form.style.display = 'block';
    const formatBlock = T.findElem(ID_FORMAT);
    const titleInput = T.findElem(ID_TITLE);
    const categoryInput = T.findElem(ID_CATEGORY);
    const tagstrInput = T.findElem(ID_TAGSTR);

    await initSaveFormatOption(formatBlock);
    titleInput.value = msg.title;
    categoryInput.value= msg.category;
    tagstrInput.value = msg.tagstr;
    MxWc.form.clearAutoComplete();
    MxWcStorage.get('categories', [])
      .then((v) => {
        MxWc.form.categoryAutoComplete = new Lib.Awesomplete(categoryInput, {
          autoFirst: true,
          minChars: 1,
          list: v
        })
        if(msg.category === ''){
          categoryInput.focus();
        }
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
        if(msg.category !== '') {
          tagstrInput.focus();
        }
      })
    return true;
  }

  function saveForm(){
    hideForm();
    unbindListener();

    const formatBlock = T.findElem(ID_FORMAT);
    const titleInput = T.findElem(ID_TITLE);
    const categoryInput = T.findElem(ID_CATEGORY);
    const tagstrInput = T.findElem(ID_TAGSTR);

    sendFrameMsgToTop('startClip', {
      format: formatBlock.querySelector(".active").getAttribute('data-value'),
      title: titleInput.value,
      category: categoryInput.value,
      tagstr: tagstrInput.value,
    })
  }

  function cancelForm(){
    hideForm();
    sendFrameMsgToTop('cancelForm');
  }

  function hideForm(msg){
    T.firstElem(CLASS_FORM).style.display = 'none';
    console.log('hideForm');
  }

  function destroy(msg) {
    sendFrameMsgToTop('frame.control.removeMe');
  }

  /************** Find Element ****************/
  function getStateBar(){
    return T.firstElem(CLASS_STATE_BAR);
  }
  function getEntryBtn(){
    return T.findElem(ID_BTN);
  }
  function getEntryUI(){
    return T.findElem(ID_ENTRY);
  }


  /************** Others ****************/

  function stopEvent(e){
    e.stopPropagation();
    e.preventDefault();
  }

  function sendFrameMsgToTop(type, msg){
    FrameMsg.send({ to: 'top', type: type, msg: (msg || {}) });
  }


  const MxWc = {}
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

  initUI();
  initFrameMsg();
  listenFrameMsg();
  console.log('control layer ready..');
})();
