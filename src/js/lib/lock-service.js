

'use strict';

this.createLockService = function(interval) {
  let state = {};
  let actions = [];
  let canConsume = false;
  let timeoutId = null;
  let stopInterval = interval;

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
      timeoutId = setTimeout(consume, Math.max(interval, stopInterval));
    }
  }

  function start(){
    canConsume = true;
    consume();
  }

  // perform action after other actions.
  function last(action) {
    get((state) => {
      // We must do slowly. otherwise we will lost action.
      // console.log('slow interval');
      stopInterval = 200;
    });
    get((state) => {
      // set stopInterval back to normal interval.
      stopInterval = interval;
      if(actions.length === 0){
        // no more action, Do it now
        action(state);
      }else{
        last(action);
      }
    })
  }

  function stop(){
    last((state) => {
      canConsume = false;
      state = {};
      actions = [];
      if(timeoutId){
        console.log('clear timeout');
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    });
  }

  return {
    start: start,
    get: get,
    last: last,
    stop: stop
  }
}
