
"use strict";

// require Tool
// require MxWcStorage

this.MxWcNotification = (function(){

  /*
   * type: success, warning, danger, info
   */
  function add(type, content, callback) {
    get((v) => {
      const now = T.currentTime();
      v.unshift({
        id: now.str.intMs,
        type: type,
        content: content,
        createdAt: now.toString()
      });
      set(v).then(callback);
    })
  }

  function remove(id) {
    get((v) => {
      let idx = -1;
      v.forEach((it, index) => {
        if(it.id === id){
          idx = index;
        }
      });
      if(idx > -1) {
        const notification = v[idx];
        v = T.remove(v, notification);
        set(v);
      }
    })
  }

  function clear() {
    set([]);
  }

  function get(callback){
    MxWcStorage.get('notifications', []).then(callback)
  }

  function set(v) {
    return MxWcStorage.set('notifications', v);
  }


  return {
    get: get,
    add: add,
    remove: remove,
    clear: clear
  }
})();
