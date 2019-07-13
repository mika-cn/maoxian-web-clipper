/*!
 * Communication between iframe and top window
 *
 * Normal message
 *
 * topWindow --> iframe
 * iframe    --> topWindow
 * iframe    --> topWindow --> otherIframe
 *
 * Broadcast message
 *
 * topWindow --> Iframe
 */

"use strict";

this.FrameMsg = (function(window){
  const state = {
    id: null,
    origin: null,
    allowOrigins: [],
    listeners: {},
    ready: false,
  };

  // options: {id:, :origin, allowOrigins}
  function init(options){
    const {id, origin, allowOrigins = []} = options;
    state.id = id;
    state.origin = origin;
    state.allowOrigins = allowOrigins;
    state.ready = true;
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

  // Broadcast to children only.
  // params: {:type, :msg}
  function broadcast(params) {
    const message = params;
    message.broadcast = true;
    const frames = document.querySelectorAll('iframe');
    frames.forEach(function(frame) {
      if(!isExtensionFrame(frame)) {
        const {targetWindow, targetOrigin} = frame2TargetInfo(frame);
        targetWindow.postMessage(message, targetOrigin);
      }
    });
  }

  // params: {:to, :type, :msg}
  function send(params){
    const message = params;
    const {to} = params;
    const {targetWindow, targetOrigin} = getTargetInfo(to);
    //console.log(to, message);
    targetWindow.postMessage(message, targetOrigin);
  }

  function receiveMessage(e) {
    if(state.allowOrigins.length > 0 && state.allowOrigins.indexOf(e.origin) < 0){
      return;
    }
    const {to, type, msg, broadcast = false} = e.data;
    if (broadcast || state.id === to) {
      const handler = state.listeners[type];
      if(handler){
        handler(msg, type);
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

  function getTargetInfo(to){
    if (state.id === 'top') {
      const frame = document.getElementById(to);
      if(frame){
        return frame2TargetInfo(frame);
      } else {
        console.trace();
        throw new Error(`Can not find frame with id: ${to}`);
      }
    } else {
      return {
        targetWindow: window.parent,
        targetOrigin: state.allowOrigins[0]
      }
    }
  }

  function frame2TargetInfo(frame) {
    return {
      targetWindow: frame.contentWindow,
      targetOrigin: (new URL(frame.src)).origin
    }
  }

  function isExtensionFrame(frame){
    const url = frame.src;
    if(url.indexOf('://') > -1) {
      const protocol = url.split('://')[0];
      return !!protocol.match(/-extension$/);
    } else {
      return false
    }
  }

  function isReady() {
    return state.ready;
  }


  return {
    init: init,
    isReady: isReady,
    send: send,
    broadcast: broadcast,
    addListener: addListener,
    removeListener: removeListener,
    clearListener: clearListener,
  }
})(window);
