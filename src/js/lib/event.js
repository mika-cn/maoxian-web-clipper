
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
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
   * Events that we use internally only.
   *   mx-wc.assistant.not-plan-matched
   *
   */

  const evTarget_public = document;
  const evTarget_internal = document.createElement('mx-wc-internal');

  function dispatchInternal(name, data) {
    const evType = getType(name, true);
    dispatch(evTarget_internal, evType, data);
  }

  function dispatchPublic(name, data) {
    const evType = getType(name);
    dispatch(evTarget_public, evType, data);
  }

  function listenInternal(name, listener) {
    const evType = getType(name, true);
    listen(evTarget_internal, evType, listener);
  }

  function listenPublic(name, listener) {
    const evType = getType(name);
    listen(evTarget_public, evType, listener);
  }

  function broadcastPublic(name, data) {
    const evType   = getType(name);
    FrameMsg.broadcast({type: evType, msg: (data || {})});
  }

  function broadcastInternal(name, data) {
    const evType = getType(name, true);
    FrameMsg.broadcast({type: evType, msg: (data || {})});
  }

  const BROADCAST_EVENT_NAMES = [
    'idle', 'selecting', 'selected',
    'confirmed', 'clipping'
  ];

  // you should call FrameMsg.init before call this function
  function handleBroadcastPublic() {
    BROADCAST_EVENT_NAMES.forEach(function(name) {
      const evType   = getType(name);
      FrameMsg.addListener(evType, broadcastHandler_public);
    });
  }

  // you should call FrameMsg.init before call this function
  function handleBroadcastInternal() {
    BROADCAST_EVENT_NAMES.forEach(function(name) {
      const evType   = getType(name, true);
      FrameMsg.addListener(evType, broadcastHandler_internal);
    });
  }

  //=================

  function broadcastHandler_public(msg, type) {
    dispatch(evTarget_public, type, msg);
    // Continue broadcast this message.
    FrameMsg.broadcast({type: type, msg: msg});
  }

  function broadcastHandler_internal(msg, type) {
    dispatch(evTarget_internal, type, msg);
    // Continue broadcast this message.
    FrameMsg.broadcast({type: type, msg: msg});
  }

  function listen(evTarget, type, listener) {
    evTarget.removeEventListener(type, listener);
    evTarget.addEventListener(type, listener);
  }

  function dispatch(evTarget, type, data) {
    const detailJson = JSON.stringify(data || {})
    const e = new CustomEvent(type, {detail: detailJson});
    evTarget.dispatchEvent(e);
  }

  function getType(name, isInternal) {
    const r = ['mx-wc', name]
    if(isInternal) { r.unshift('___') }
    return r.join('.');
  }

  function getData(e) {
    if(typeof e.detail === 'string') {
      // Firefox(Gecko) restict (for secure reason) e.detail when it is a custom object.
      // We use json string to walk around.
      return JSON.parse(e.detail);
    } else {
      // Ensure compatible with old version(mx-wc-tool.js)
      // e.detail is a custom object.
      return e.detail;
    }
  }

  return {
    getType: getType,
    getData: getData,
    broadcastPublic: broadcastPublic,
    broadcastInternal: broadcastInternal,
    handleBroadcastPublic: handleBroadcastPublic,
    handleBroadcastInternal: handleBroadcastInternal,
    dispatchInternal: dispatchInternal,
    dispatchPublic, dispatchPublic,
    listenInternal: listenInternal,
    listenPublic, listenPublic
  }
});
