
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
        width: auto;
        height: auto;
        right: 10px;
        top: 88px;
        /*border: solid 1px #ccc;*/
        z-index: 9999999;
      }
      .notice-success {
        background: #d4edda;
        color: #155724;
        line-height: 20px;
        font-size: 13px;
        padding: 10px 20px 10px 20px;
        border: solid 1px #888;
        border-radius: 5px;
        margin-bottom: 15px;
      }
      .notice-danger {
        background: #f8d7da;
        color: #721c24;
        line-height: 20px;
        font-size: 13px;
        padding: 10px 20px 10px 20px;
        border: solid 1px #888;
        border-radius: 5px;
        margin-bottom: 15px;
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

  /*
   * options: {
   *   type: 'success'(default), 'danger'
   *   timeout: time to disappear, millisecond
   * }
   */
  function add(content, options = {}){
    const container = renderContainer();
    const elem = document.createElement('div')
    const type = options.type || 'success';
    elem.innerHTML = content;
    elem.classList.add('notify');
    elem.classList.add(['notice', type].join('-'));
    const id = ['notify', generateId()].join('.');
    elem.id = id;
    container.appendChild(elem);
    removeItLater(id, options);
  }

  function removeItLater(id, options) {
    const remove = function(){
      const elem = document.getElementById(id);
      if(elem) {
        const container = getContainer();
        container.removeChild(elem);
        const notifies = container.querySelectorAll('.notify')
        if(notifies.length == 0){
          removeContainer();
        }
      }
    }
    const ms = (options.timeout || 1500);
    setTimeout(remove, ms);
  }

  function generateId(){
    return '' + Math.round(Math.random() * 100000000000);
  }

  return {add: add}
})();
