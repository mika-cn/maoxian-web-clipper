"use strict";

const KLASS = 'notify-container';

function getContainer(){
  return document.querySelector('.' + KLASS);
}

function style(){
  return `
    .notify-container {
      display: block;
      position: fixed;
      min-width: 200px;
      width: auto;
      height: auto;
      right: 10px;
      top: 88px;
      z-index: 9999999;
    }
    .notify {
      line-height: 18px;
      font-size: 13px !important;
      padding: 3px;
      border: solid 1px #aaa;
      border-radius: 3px;
      margin-bottom: 15px;
      background-color: #333;
      color: #efefef;
    }
    .notify > .notify-btn {
      cursor: pointer;
      display: inline-block;
      width: 20px;
      height: 20px;
      position: relative;
      top: 4px;
      margin-right: 5px;
      padding: 0px !important;
      background-color: #333;
    }

    .notify > .notify-btn .r1,
    .notify > .notify-btn .r2,
    .notify > .notify-btn .r3,
    .notify > .notify-btn .r4,
    .notify > .notify-btn .r5 {
      height: 4px;
      line-height: 0px;
      box-sizing: border-box;
    }

    .notify > .notify-btn span {
      display: inline-block;
      width: 20%;
      height: 100%;
      /*border-radius: 2px;*/
    }
    .notify:hover > .notify-btn .c11,
    .notify:hover > .notify-btn .c15,
    .notify:hover > .notify-btn .c22,
    .notify:hover > .notify-btn .c24,
    .notify:hover > .notify-btn .c33,
    .notify:hover > .notify-btn .c42,
    .notify:hover > .notify-btn .c44,
    .notify:hover > .notify-btn .c51,
    .notify:hover > .notify-btn .c55 { background-color: #ccc; }

    .notify > .notify-content {
      display: inline-block;
      font-size: 14px;
      height: 20px;
      line-height: 20px;
      position: relative;
      top: 1px;
      padding: 0px 10px !important;
    }
    .notify > .notify-content > a{
      color: #ffff00 !important;
    }
    .notify:hover > .notify-btn{
      color: #efefef;
    }
    .notice-success:hover > .notify-btn{
      color: #d4edda;
    }
    .notice-danger:hover > .notify-btn{
      color: #f8d7da;
    }
  `;
}

function renderContainer(){
  let elem = getContainer();
  if(!elem) {
    elem = document.createElement('div');
    elem.classList.add(KLASS);
    elem.innerHTML = "<style>" + style() + "</style>";
    document.body.appendChild(elem);
    return elem;
  } else {
    return elem;
  }
}

function removeContainer(){
  let elem = getContainer();
  if(elem) { document.body.removeChild(elem); }
}

function success(content) {
  add(content)
}

function danger(content) {
  add(content, {
    type: 'danger',
    behavior: 'manualDismiss'
  })
}

/*
 * options: {
 *   type: 'success'(default), 'danger'
 *   timeout: time to disappear, millisecond
 *   behavior: autoDismiss (default), manualDismiss
 * }
 */
function add(content, options = {}){
  const container = renderContainer();
  const elem = document.createElement('div')
  const type = options.type || 'success';
  const behavior = options.behavior || 'autoDismiss';
  elem.innerHTML = renderNotify(content, behavior, type);
  elem.classList.add('notify');
  elem.classList.add(['notice', type].join('-'));
  const id = ['notify', generateId()].join('.');
  elem.id = id;
  container.appendChild(elem);
  bindListener(container);
  if(behavior === 'autoDismiss') {
    removeItLater(id, options);
  }
}

function bindListener(container) {
  container.removeEventListener('click', containerClicked);
  container.addEventListener('click', containerClicked);
}

function containerClicked(e) {
  if (e.target.tagName.toUpperCase() === 'A') {
    const elem = getNotifyByTarget(e.target);
    removeNotify(elem);
  } else {
    const btn = getBtnTarget(e.target)
    if (btn) {
      const elem = getNotifyByTarget(btn);
      removeNotify(elem);
    }
  }
}

function getNotifyByTarget(evTarget) {
  if (evTarget.classList.contains('notify')) {
    return evTarget;
  } else {
    return getNotifyByTarget(evTarget.parentNode);
  }
}

function getBtnTarget(evTarget) {
  if(evTarget.classList.contains('notify')) { return null }
  if(evTarget.className === 'notify-btn') {
    return evTarget;
  } else {
    return getBtnTarget(evTarget.parentElement);
  }
}

function renderNotify(content, behavior, type) {
  const html = content.replace(/\n/g, '<br />');
  return `
    <div class="notify-btn" title="Dismiss me">
      <div class="r1"><span class="c11"></span><span class="c12"></span><span class="c13"></span><span class="c14"></span><span class="c15"></span></div>
      <div class="r2"><span class="c21"></span><span class="c22"></span><span class="c23"></span><span class="c24"></span><span class="c25"></span></div>
      <div class="r3"><span class="c31"></span><span class="c32"></span><span class="c33"></span><span class="c34"></span><span class="c35"></span></div>
      <div class="r4"><span class="c41"></span><span class="c42"></span><span class="c43"></span><span class="c44"></span><span class="c45"></span></div>
      <div class="r5"><span class="c51"></span><span class="c52"></span><span class="c53"></span><span class="c54"></span><span class="c55"></span></div>
    </div>
    <div class="notify-content">${html}</div>
  `;
}

function removeItLater(id, options) {
  const remove = function(){
    const elem = document.getElementById(id);
    removeNotify(elem);
  }
  const ms = (options.timeout || 1500);
  setTimeout(remove, ms);
}

function removeNotify(elem){
  if(elem) {
    const container = getContainer();
    container.removeChild(elem);
    const notifies = container.querySelectorAll('.notify')
    if(notifies.length == 0){
      removeContainer();
    }
  }
}

function generateId(){
  return '' + Math.round(Math.random() * 100000000000);
}

const Notify = {
  getContainer: getContainer,
  success: success,
  error: danger
}

export default Notify;
