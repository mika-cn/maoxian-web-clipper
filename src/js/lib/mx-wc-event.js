
;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcEvent', ['MxWcFrameMsg'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(require('./frame-msg.js'));
  } else {
    // browser or other
    root.MxWcEvent = factory(root.MxWcFrameMsg);
  }
})(this, function(FrameMsg, undefined) {
  "use strict";

  /*!
   *
   * We use FrameMsg to broadcast event
   * from top window to iframes.
   *
   * Events that we dispatch to public.
   *   mx-wc.ready
   *   mx-wc.idle
   *   mx-wc.selecting
   *   mx-wc.selected
   *   mx-wc.confirmed
   *   mx-wc.clipping
   *   mx-wc.completed
   *
   * Events that we listen from public.
   *   mx-wc.focus-elem
   *   mx-wc.confirm-elem
   *   mx-wc.clip-elem
   *   mx-wc.set-form-input
   *
   */

  function dispatchInternal(name, data) {
    const evType = getType(name, true);
    dispatch(evType, data);
  }

  function dispatchPublic(name, data) {
    const evType = getType(name);
    dispatch(evType, data);
  }

  function listenInternal(name, listener) {
    const evType = getType(name, true);
    listen(evType, listener);
  }

  function listenPublic(name, listener) {
    const evType = getType(name);
    listen(evType, listener);
  }

  function broadcast2Iframe(name, data) {
    const evType = getType(name);
    FrameMsg.broadcast({type: evType, msg: (data || {})});
  }

  // you should call FrameMsg.init before call this function
  function handleBroadcast() {
    [
      'idle', 'selecting', 'selected',
      'confirmed', 'clipping'
    ].forEach(function(name) {
      const evType = getType(name);
      FrameMsg.addListener(evType, broadcastHandler);
    })
  }

  //=================

  function broadcastHandler(msg, type) {
    dispatch(type, msg);
    // Continue broadcast this message.
    FrameMsg.broadcast({type: type, msg: msg});
  }

  function listen(type, listener) {
    document.removeEventListener(type, listener);
    document.addEventListener(type, listener);
  }

  function dispatch(type, data) {
    const detailJson = JSON.stringify(data || {})
    const e = new CustomEvent(type, {detail: detailJson});
    document.dispatchEvent(e);
  }

  function getType(name, isInternal) {
    const r = ['mx-wc', name]
    if(isInternal) { r.unshift('___') }
    return r.join('.');
  }


  return {
    getType: getType,
    broadcast2Iframe: broadcast2Iframe,
    handleBroadcast: handleBroadcast,
    dispatchInternal: dispatchInternal,
    dispatchPublic, dispatchPublic,
    listenInternal: listenInternal,
    listenPublic, listenPublic
  }
});
