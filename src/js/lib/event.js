"use strict";

import FrameMsg from './frame-msg.js';

/*!
 *
 * We use FrameMsg to broadcast event
 * from top window to iframes.
 *
 * Events that we dispatch to public.
 *   mx-wc.ready
 *   mx-wc.idle
 *   mx-wc.actived
 *   mx-wc.selecting
 *   mx-wc.selected
 *   mx-wc.confirmed
 *   mx-wc.clipping
 *   mx-wc.completed
 *
 * Events that we listen from public.
 *   mx-wc.focus-elem (deprecated)
 *   mx-wc.select-elem
 *   mx-wc.confirm-elem
 *   mx-wc.clip-elem
 *   mx-wc.set-form-input
 *
 * Events that we use internally only.
 *   mx-wc.assistant.not-plan-matched
 *
 */

function dispatchInternal(name, data) {
  const evType = getType(name, true);
  dispatch('internal', evType, data);
}

function dispatchPublic(name, data) {
  const evType = getType(name);
  dispatch('public', evType, data);
}

function listenInternal(name, listener) {
  const evType = getType(name, true);
  listen('internal', evType, listener);
}

function listenPublic(name, listener) {
  const evType = getType(name);
  listen('public', evType, listener);
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

function initFrameMsg(params) {
  FrameMsg.init(params);
}

// you should call initFrameMsg before calling this function
function handleBroadcastPublic() {
  BROADCAST_EVENT_NAMES.forEach(function(name) {
    const evType   = getType(name);
    FrameMsg.addListener(evType, broadcastHandler_public);
  });
}

// you should call initFrameMsg before calling this function
function handleBroadcastInternal() {
  BROADCAST_EVENT_NAMES.forEach(function(name) {
    const evType   = getType(name, true);
    FrameMsg.addListener(evType, broadcastHandler_internal);
  });
}

//=================

function broadcastHandler_public(msg, type) {
  dispatch('public', type, msg);
  // Continue broadcast this message.
  FrameMsg.broadcast({type: type, msg: msg});
}

function broadcastHandler_internal(msg, type) {
  dispatch('internal', type, msg);
  // Continue broadcast this message.
  FrameMsg.broadcast({type: type, msg: msg});
}

function listen(evTargetName, type, listener) {
  const evTarget = getEvTarget(evTargetName);
  evTarget.removeEventListener(type, listener);
  evTarget.addEventListener(type, listener);
}

function dispatch(evTargetName, type, data) {
  const evTarget = getEvTarget(evTargetName);
  const detailJson = JSON.stringify(data || {})
  const e = new CustomEvent(type, {detail: detailJson});
  evTarget.dispatchEvent(e);
}

function getEvTarget(evTargetName) {
  if (evTargetName === 'public') {
    return document;
  }

  if (evTargetName === 'internal') {
    let target = document.___mx_wc_internal__;
    if (!target) {
      target = document.createElement('mx-wc-internal');
      document.___mx_wc_internal__=target;
    }
    return target;
  }
}

function getType(name, isInternal) {
  const r = ['mx-wc', name]
  if(isInternal) { r.unshift('___') }
  return r.join('.');
}

function getData(e) {
  if (typeof e.detail === 'string') {
    // Firefox(Gecko) restict (for secure reason) e.detail when it is a custom object.
    // We use json string to walk around.
    try {
      return JSON.parse(e.detail);
    } catch(e) {
      return {};
    }
  } else if (typeof e.detail === 'undefined'){
    return {};
  } else {
    // Ensure compatible with old version(mx-wc-tool.js)
    // e.detail is a custom object.
    return e.detail;
  }
}

const MxWcEvent = {
  getType,
  getData,
  broadcastPublic,
  broadcastInternal,
  initFrameMsg,
  handleBroadcastPublic,
  handleBroadcastInternal,
  dispatchInternal,
  dispatchPublic,
  listenInternal,
  listenPublic,
}

export default MxWcEvent;
