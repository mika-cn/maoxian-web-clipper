
"use strict;"

this.Notify = (function(){
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
        font-size: 13px;
        padding: 0px;
        border: solid 1px #aaa;
        border-radius: 3px;
        margin-bottom: 15px;
        background-color: #333;
        color: #efefef;
      }
      .notify > .btn {
        cursor: pointer;
        display: inline-block;
        line-height: 30px;
        width: 30px;
        height: 30px;
      }
      .notify > .content {
        display: inline-block;
        height: 30px;
        line-height: 30px;
        padding-left: 10px;
        padding-right: 10px;
      }
      .notify:hover {
        border-top-left-radius: 15px;
        border-bottom-left-radius: 15px;
      }
      .notify:hover > .btn {
        border-radius: 15px;
      }
      .notice-success:hover > .btn{
        background: #d4edda;
      }
      .notice-danger:hover > .btn{
        background: #f8d7da;
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
    if(e.target.className === 'btn'){
      const container = getContainer();
      removeNotify(e.target.parentNode);
    }
  }

  function renderNotify(content, behavior, type) {
    return `<label class="btn" title="dismiss me">&nbsp;</label><label class="content">${content}</label>
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
    success: success,
    error: danger
  }
})();
