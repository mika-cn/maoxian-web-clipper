"use strict";

/*!
 *
 * We use ExtMsg to broadcast event
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
  const topFrameId = 0;
  performBroadcast({
    type: evType,
    msg: (data || {}),
    evTargetName: 'public',
    extMsgType: 'broadcast-event.public',
    frameId: topFrameId,
  })
}

function broadcastInternal(name, data) {
  const evType = getType(name, true);
  const topFrameId = 0;
  performBroadcast({
    type: evType,
    msg: (data || {}),
    evTargetName: 'internal',
    extMsgType: 'broadcast-event.internal',
    frameId: topFrameId,
  })
}

const BROADCASTABLE_PUBLIC_EVENTS = [
  getType('idle'),
  getType('selecting'),
  getType('selected'),
  getType('confirmed'),
  getType('clipping'),
];

const BROADCASTABLE_INTERNAL_EVENTS = [
  getType('idle'      , true) ,
  getType('selecting' , true) ,
  getType('selected'  , true) ,
  getType('confirmed' , true) ,
  getType('clipping'  , true) ,
];

const state = {};
function init(ExtMsg) {
  state.ExtMsg = ExtMsg;
}

function extMsgReceived(msgBody, {isInternal}) {
  if (isInternal) {
    handleBroadcastInternal(msgBody);
  } else {
    handleBroadcastPublic(msgBody);
  }
}

function handleBroadcastInternal(msgBody) {
  if (BROADCASTABLE_INTERNAL_EVENTS.indexOf(msgBody.evType) > -1) {
    dispatch('internal', msgBody.evType, msgBody.message);
    performBroadcast({
      msg: msgBody.message,
      type: msgBody.evType,
      evTargetName: 'internal',
      extMsgType: 'broadcast-event.internal',
      frameId: (msgBody.frameId || 0),
    })
  }
}

function handleBroadcastPublic(msgBody) {
  if (BROADCASTABLE_PUBLIC_EVENTS.indexOf(msgBody.evType) > -1) {
    dispatch('public', msgBody.evType, msgBody.message);
    performBroadcast({
      msg: msgBody.message,
      type: msgBody.evType,
      evTargetName: 'public',
      extMsgType: 'broadcast-event.public',
      frameId: (msgBody.frameId || 0),
    })
  }
}



//=================

function performBroadcast({msg, type, evTargetName, extMsgType, frameId = 0}) {
  // Continue broadcast this message.
  state.ExtMsg.sendToBackend('clipping', {
    type: extMsgType,
    body: {
      frameId: frameId,
      evType: type,
      message: msg
    }
  });
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
  init,
  getType,
  getData,
  extMsgReceived,
  broadcastPublic,
  broadcastInternal,
  dispatchInternal,
  dispatchPublic,
  listenInternal,
  listenPublic,
}

export default MxWcEvent;
