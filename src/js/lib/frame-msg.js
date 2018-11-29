/*!
 * Communication between iframe and top window
 *
 * topWindow --> iframe
 * iframe    --> topWindow
 * iframe    --> topWindow --> otherIframe
 */

"use strict";

this.FrameMsg = (function(window){
  const state = {
    id: null,
    origin: null,
    allowOrigins: [],
    listeners: {},
  };

  // options: {id:, :origin, allowOrigins}
  function init(options){
    const {id, origin, allowOrigins} = options;
    state.id = id;
    state.origin = origin;
    state.allowOrigins = allowOrigins;
    window.addEventListener('message', receiveMessage, false);
  }

  function addListener(type, callback){
    state.listeners[type] = callback;
  }

  function removeListener(type){
    state.listeners[type] = null;
  }

  function clearListener(){
    state.listeners = {};
  }

  // params: {:to, :type, :msg}
  function send(params){
    const message = params;
    const {to} = params;
    const {targetWindow, targetOrigin} = getTargetInfo(to);
    //console.log(to, message);
    targetWindow.postMessage(message, targetOrigin);
  }

  function getTargetInfo(to){
    if (state.id === 'top') {
      const frame = document.getElementById(to);
      if(frame){
        const frameUrl = new URL(frame.src);
        return {
          targetWindow: frame.contentWindow,
          targetOrigin: frameUrl.origin
        }
      } else {
        throw new Error(`Can not find frame with id: ${to}`);
      }
    } else {
      return {
        targetWindow: window.parent,
        targetOrigin: state.allowOrigins[0]
      }
    }
  }

  function receiveMessage(e) {
    if(state.allowOrigins.indexOf(e.origin) < 0){ return; }
    const {to, type, msg} = e.data;
    if (state.id === to) {
      const handler = state.listeners[type];
      if(handler){
        handler(msg);
      }
    } else {
      if (state.id === 'top') {
        // deliver message to other frame
        send(e.data)
      } else {
        console.warn("unknow message", to, msg);
      }
    }
  }

  return {
    init: init,
    send: send,
    addListener: addListener,
    removeListener: removeListener,
    clearListener: clearListener,
  }
})(window);
