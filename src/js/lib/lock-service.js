

'use strict';

this.createLockService = function(interval) {
  let state = {};
  let actions = [];
  let canConsume = false;
  let timeoutId = null;

  function get(action) {
    if(canConsume) {
      actions.push(action);
    } else {
      throw new Error("Can't consume");
    }
  }

  function consume() {
    if(canConsume) {
      //console.log(Date.now());
      if(actions.length > 0){
        const action = actions.shift();
        action(state);
      }
      timeoutId = setTimeout(consume, interval);
    }
  }

  function start(){
    canConsume = true;
    consume();
  }

  function stop(){
    get((state) => {
      if(actions.length === 0){
        // no more action, stop now.
        stopNow();
      }else{
        // wait action to complete
        stop();
      }
    })
  }

  function stopNow(){
    canConsume = false;
    state = {};
    actions = [];
    if(timeoutId){
      console.log('clear timeout');
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  return {
    get: get,
    start: start,
    stop: stop
  }
}
