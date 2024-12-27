"use strict";

import localeEn    from '../_locales/en/ui-control.js';
import localeZhCN  from '../_locales/zh_CN/ui-control.js';
import I18N         from '../js/lib/translation.js';
import Log          from '../js/lib/log.js';
import T            from '../js/lib/tool.js';
import MxWcTemplate from '../js/lib/template.js';
import MxWcStorage  from '../js/lib/storage.js';
import MxWcConfig   from '../js/lib/config.js';
import FrameMsg     from '../js/lib/frame-msg.js';
import AutoComplete from '../js/lib/auto-complete.js';

const ID = 'mx-wc-iframe-control';

const ID_SWITCH_BTN    = 'switch-btn';
const CLASS_STATE_BAR  = 'state-bar';
const CLASS_HINT       = 'hint';

const ID_TITLE         = "title";
const ID_CATEGORY      = "category";
const ID_TAGSTR        = "tagstr";
const CLASS_FORM       = "save-form";
const CLASS_SAVE_BTN   = 'save-button';
const CLASS_CANCEL_BTN = 'cancel-button';
const INPUT_TAG_NAMES = ['INPUT', 'TEXTAREA'];
const CLASS_FORM_INPUTS = ['save-form', 'input-group', 'actions'];

function initUI(){
  const gbox = T.queryElem('.gbox');
  const uiHtml = T.findElem('ui-tpl').innerHTML;
  T.setHtml(gbox, uiHtml);
  setTimeout(initUIListener, 0);
}

function initUIListener() {
  const btn = getEntryBtn();
  const saveBtn = T.firstElem(CLASS_SAVE_BTN);
  const cancelBtn = T.firstElem(CLASS_CANCEL_BTN);
  const titleInput = T.findElem(ID_TITLE);
  const categoryInput = T.findElem(ID_CATEGORY);
  const tagstrInput = T.findElem(ID_TAGSTR);
  T.bindOnce(btn, 'click', entryClick);

  const bar = getStateBar();
  MxWcConfig.load().then((config) => {

    if(config.mouseModeEnabled && bar) {
      bar.classList.add('mouse-friendly')
      const helperPanel = T.firstElem('help');
      helperPanel.classList.add('mouse-friendly');
      //bind kbd listener
      T.bindOnce(helperPanel, 'click', keyboardClicked);
    }

    // mobile ui
    const opBtnPanel = T.queryElem('.op-btn-panel');
    T.bindOnce(opBtnPanel, 'click', keyboardClicked);
  });

  // show help hint to new user.
  MxWcStorage.get('categories', [])
    .then((v) => {
      if(v.length == 0 && bar){
        bar.classList.add('new-user');
      }
    })

  T.bindOnce(saveBtn     , 'click'    , submitForm);
  T.bindOnce(cancelBtn   , 'click'    , cancelForm);
  T.bindOnce(saveBtn     , 'keypress' , formEnterKeyHandler);
  T.bindOnce(cancelBtn   , 'keypress' , formEnterKeyHandler);
  T.bindOnce(tagstrInput , 'keypress' , formEnterKeyHandler);
  T.bindOnce(titleInput  , 'keypress' , formEnterKeyHandler);
  T.bindOnce(categoryInput, 'keypress', formEnterKeyHandler);
  T.bindOnce(tagstrInput , 'focus' , selectInputFieldValue);
  T.bindOnce(titleInput  , 'focus' , selectInputFieldValue);
  T.bindOnce(categoryInput, 'focus', selectInputFieldValue);


  window.focus();
}

function keyboardClicked(e) {
  if(e.target.tagName.toUpperCase() === 'KBD') {
    const keyCode = parseInt(e.target.getAttribute('data-key-code'));
    if(keyCode > -2000) {
      // webpage relative event
      sendKeyPressMessage(keyCode);
    } else {
      // other key
      switch(keyCode) {
        case -2001: toggleOpBtnGroup(); break;
        case -2002: showHelpModal();break;
      }
    }
  }
}

// mobile op buttons
function toggleOpBtnGroup() {
  const klass = 'show';
  const [groupB, groupC] =T.queryElems(".op-btn-group.group-b,.op-btn-group.group-c");
  groupB.classList.toggle(klass)
  groupC.classList.toggle(klass)
}

function showHelpModal() {
  const modal = T.queryElem('.help-modal');
  modal.style.display = 'block';
  T.bindOnce(modal, 'click', helpModalClicked);
}

function helpModalClicked(e) {
  const modal = T.queryElem('.help-modal');
  modal.style.display = 'none';
  stopEvent(e);
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
  FrameMsg.addListener('bindMouseMove', bindMouseMove);
  FrameMsg.addListener('unbindMouseMove', unbindMouseMove);
  FrameMsg.addListener('setStateIdle', setStateIdle);
  FrameMsg.addListener('setStateSelecting', setStateSelecting);
  FrameMsg.addListener('setStateSelected', setStateSelected);
  FrameMsg.addListener('setStateConfirmed', setStateConfirmed);
  FrameMsg.addListener('setStateClipping', setStateClipping);
  FrameMsg.addListener('setStateClipped', setStateClipped);
  FrameMsg.addListener('setSavingHint', setSavingHint);
  FrameMsg.addListener('setSavingStateStarted', setSavingStateStarted);
  FrameMsg.addListener('setSavingStateProgress', setSavingStateProgress);
  FrameMsg.addListener('setSavingStateCompleted', setSavingStateCompleted);
  FrameMsg.addListener('showForm', showForm);
  FrameMsg.addListener('hideForm', hideForm);
  FrameMsg.addListener('destroy', destroy);
}

/************** event listener ****************/

function bindListener(msg) {
  bindMouseMove();
  T.bind(document, 'click', clickHandler, true);
  T.bind(document, 'keydown', keyDownHandler, true);
};

function unbindListener(msg) {
  unbindMouseMove();
  T.unbind(document, 'click', clickHandler, true);
  T.unbind(document, 'keydown', keyDownHandler, true);
}

function bindMouseMove(msg) {
  T.bind(document, 'mousemove', mouseMoveHandler, true);
}

function unbindMouseMove(msg){
  T.unbind(document, 'mousemove', mouseMoveHandler, true);
}

function mouseMoveHandler(e) {
  sendFrameMsgToTop('mousemove', {x: e.clientX, y: e.clientY});
}

function clickHandler(e) {
  if(['HTML', 'BODY'].indexOf(e.target.tagName.toUpperCase()) > -1){
    sendFrameMsgToTop('click', {x: e.clientX, y: e.clientY});
  }
}

function keyDownHandler(e) {
  const keyCodes = [27, 13, 37, 46, 38, 39, 40];
  if(keyCodes.indexOf(e.keyCode) < 0) { return }
  if(!INPUT_TAG_NAMES.includes(e.target.tagName.toUpperCase()) && !CLASS_FORM_INPUTS.includes(e.target.parentNode.className)){
    sendKeyPressMessage(e.keyCode);
  }else{
    Log.debug(e.target.tagName);
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

function entryClick(){
  sendFrameMsgToTop('entryClick');
}

/************** change state ****************/

function setStateIdle(msg){
  const gbox = getGbox();
  const btn = getEntryBtn();
  btn.title = I18N.t('switch.title');
  gbox.classList.remove('selecting', 'selected', 'confirmed', 'clipping', 'saving');
  gbox.classList.add('idle');
  setHint('-');
}
function setStateSelecting(msg){
  const gbox = getGbox();
  const btn = getEntryBtn();
  btn.innerText = "ON";
  btn.title = I18N.t('switch.title');
  gbox.classList.remove('idle', 'selected', 'confirmed');
  gbox.classList.add('selecting');
  setHint(I18N.t('hint.selecting'));
}
function setStateSelected(msg){
  const gbox = getGbox();
  const btn = getEntryBtn();
  btn.innerText = "ON";
  btn.title = I18N.t('switch.title');
  gbox.classList.remove('idle', 'selecting', 'confirmed');
  gbox.classList.add('selected');
  setHint(I18N.t('hint.selected'));
}
function setStateConfirmed(msg){
  const gbox = getGbox();
  gbox.classList.remove('idle', 'selecting', 'selected');
  gbox.classList.add('confirmed');
  setHint('-');
}
function setStateClipping(msg){
  const gbox = getGbox();
  gbox.classList.remove('idle', 'selecting', 'selected', 'confirmed');
  gbox.classList.add('clipping');
  setHint(I18N.t('hint.clipping'));
}
function setStateClipped(msg) {
  const gbox = getGbox();
  gbox.classList.remove('clipping');
  gbox.classList.add('clipped');
  setHint(I18N.t('hint.clipped'));
}

/************** change saving state ****************/

function setSavingHint(hint) {
  const gbox = getGbox();
  gbox.classList.remove('clipping');
  gbox.classList.add('saving');
  setHint(hint);
}

function setSavingStateStarted(msg) {
  const gbox = getGbox();
  gbox.classList.remove('clipping');
  gbox.classList.add('saving');
  setHint(I18N.t('hint.saving.started'));
}

function setSavingStateProgress(msg) {
  let hint = I18N.t('hint.saving.progress')
  hint = hint.replace('$finished', msg.finished).replace('$total', msg.total);
  setHint(hint);
}

function setSavingStateCompleted(msg) {
  setHint(I18N.t('hint.saving.completed'));
}

function setHint(text){
  const elems = T.queryElems(`.${CLASS_HINT}`)
  T.each(elems, function(elem) {
    T.setHtml(elem, text);
  });
}

function getContextNode() {
  let elem = T.firstElem('desktop');
  if(T.isElemVisible(window, elem)) {
    return elem;
  }
  return T.firstElem('mobile');
}

/************** Form relative ****************/

function selectInputFieldValue(e) {
  if (e.target) { e.target.select() }
}

function formEnterKeyHandler(e){
  if(e.keyCode === 13){
    e.preventDefault();
    if ([ID_TITLE, ID_CATEGORY].indexOf(e.target.id) > -1) {
      // title input and category input
      // focus next input
      const form = T.firstElem(CLASS_FORM);
      const inputs = T.queryElems('input', form);
      const index = [].indexOf.call(inputs, e.target);
      const next = inputs[index + 1];
      if (next) { next.focus() }
    } else if (e.target.classList.contains(CLASS_CANCEL_BTN)){
      cancelForm();
    } else {
      // tagstr input and save button
      submitForm();
    }
    stopEvent(e);
  }
}


async function showForm(params){
  Log.debug('showForm');
  const {
    // formInputs
    title,
    category,
    tagstr,

    // formOptions
    titles,
    categories,
    tags,

    config
  } = params;

  const form = T.firstElem(CLASS_FORM);
  if(form.style.display == 'block'){ return false}
  setStateConfirmed();
  form.style.display = 'block';
  const titleInput = T.findElem(ID_TITLE);
  const categoryInput = T.findElem(ID_CATEGORY);
  const tagstrInput = T.findElem(ID_TAGSTR);

  titleInput.value = title;
  categoryInput.value= category;
  if (tagstr !== "") {
    tagstrInput.value = tagstr;
  } else if (config.autoInputLastTags) {
    const lastTags = (await MxWcStorage.get('last-tags', []));
    tagstrInput.value = lastTags.join(" ");
  }

  MxWc.form.clearAutoComplete();
  const doNotSort = function(a, b) { return 0 };

  // ===== title =====
  const titleList = (titles || []);
  MxWc.form.addAutoComplete(titleInput, titleList);

  // ===== category =====
  const categoryList = (categories || (await MxWcStorage.get('categories', [])));
  MxWc.form.addAutoComplete(categoryInput, categoryList);

  if(category === ''){
    if (config.autoInputLastCategory && categoryList.length > 0) {
      categoryInput.value = categoryList[0];
    }
    categoryInput.focus();
  }

  // ===== tag =====
  const tagList = (tags || (await MxWcStorage.get('tags', [])))
  MxWc.form.addAutoComplete(tagstrInput, tagList, true);

  if(category !== '') {
    tagstrInput.focus();
  }

  return true;
}



function submitForm(){
  hideForm();
  unbindListener();

  const titleInput = T.findElem(ID_TITLE);
  const categoryInput = T.findElem(ID_CATEGORY);
  const tagstrInput = T.findElem(ID_TAGSTR);

  sendFrameMsgToTop('submitForm', {
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
  Log.debug('hideForm');
  T.firstElem(CLASS_FORM).style.display = 'none';
}

function destroy(msg) {
  sendFrameMsgToTop('frame.control.removeMe');
}

/************** Find Element ****************/
function getGbox() {
  return T.queryElem(".gbox");
}
function getStateBar(){
  const node = getContextNode();
  return T.firstElem(CLASS_STATE_BAR, node);
}
function getEntryBtn(){
  return T.findElem(ID_SWITCH_BTN);

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
  autoCompleteObjs: [],

  titleAutoComplete: null,
  categoryAutoComplete: null,
  tagstrAutoComplete: null,

  addAutoComplete: function(inputElem, list, multiple = false) {
    const buttonCSSKlass = 'awesomplete-helper-btn';
    const buttonTitle = I18N.t('hint.show-options');
    const options = {multiple, buttonCSSKlass, buttonTitle};
    const it = new AutoComplete(inputElem, list, options);
    this.autoCompleteObjs.push(it);
  },

  clearAutoComplete: function(){
    this.autoCompleteObjs.forEach((it) => {
      it.destroy();
      it = undefined;
    });
    this.autoCompleteObjs = [];
  }
}

I18N.init({localeEn, localeZhCN});
initUI();
initFrameMsg();
listenFrameMsg();
Log.info('control layer ready..');
