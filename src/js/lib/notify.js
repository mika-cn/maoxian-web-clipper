
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcNotify = factory();
  }
})(this, function(undefined) {
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
        padding: 0px;
        border: solid 1px #aaa;
        border-radius: 3px;
        margin-bottom: 15px;
        background-color: #333;
        color: #efefef;
      }
      .notify > .notify-btn {
        cursor: pointer;
        display: inline-block;
        line-height: 30px;
        width: 30px;
        height: 30px;
        text-align: center;
        padding: 0px !important;
        font-size: 16px;
        color: #333;
      }
      .notify > .notify-content {
        display: inline-block;
        height: 30px;
        line-height: 30px;
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
    if(e.target.className === 'notify-btn'){
      const container = getContainer();
      removeNotify(e.target.parentNode);
    }
  }

  function renderNotify(content, behavior, type) {
    return `<label class="notify-btn" title="dismiss me">&#4030;</label><label class="notify-content">${content}</label>
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

  return {
    getContainer: getContainer,
    success: success,
    error: danger
  }
});
