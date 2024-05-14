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
 *   mx-wc.assistant.plan-disabled
 *   mx-wc.assistant.plan-has-not-pick
 *
 */

// event scope
const [PUBLIC, PAGE_SCRIPT, INTERNAL] = [1,2,3];

function dispatchInternal(name, data) {
  const evType = getType(name, INTERNAL);
  dispatch(INTERNAL, evType, data);
}


function dispatchPublic(name, data) {
  const evType = getType(name, PUBLIC);
  dispatch(PUBLIC, evType, data);
}

function dispatchPageScript(name, data) {
  const evType = getType(name, PAGE_SCRIPT);
  dispatch(PAGE_SCRIPT, evType, data);
}


function listenInternal(name, listener) {
  const evType = getType(name, INTERNAL);
  listen(INTERNAL, evType, listener);
}

function listenPageScript(name, listener) {
  const evType = getType(name, PAGE_SCRIPT);
  listen(PAGE_SCRIPT, evType, listener);
}

function listenPublic(name, listener) {
  const evType = getType(name, PUBLIC);
  listen(PUBLIC, evType, listener);
}

function broadcastPublic(name, data) {
  const evType   = getType(name, PUBLIC);
  const topFrameId = 0;
  performBroadcast({
    type: evType,
    msg: (data || {}),
    extMsgType: 'broadcast-event.public',
    frameId: topFrameId,
  })
}

function broadcastInternal(name, data) {
  const evType = getType(name, INTERNAL);
  const topFrameId = 0;
  performBroadcast({
    type: evType,
    msg: (data || {}),
    extMsgType: 'broadcast-event.internal',
    frameId: topFrameId,
  })
}

const BROADCASTABLE_PUBLIC_EVENTS = [
  getType('idle'      , PUBLIC) ,
  getType('selecting' , PUBLIC) ,
  getType('confirmed' , PUBLIC) ,
  getType('clipping'  , PUBLIC) ,
];

const BROADCASTABLE_INTERNAL_EVENTS = [
  getType('idle'      , INTERNAL) ,
  getType('selecting' , INTERNAL) ,
  getType('confirmed' , INTERNAL) ,
  getType('clipping'  , INTERNAL) ,
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
    dispatch(INTERNAL, msgBody.evType, msgBody.message);
    performBroadcast({
      msg: msgBody.message,
      type: msgBody.evType,
      extMsgType: 'broadcast-event.internal',
      frameId: (msgBody.frameId || 0),
    })
  }
}


function handleBroadcastPublic(msgBody) {
  if (BROADCASTABLE_PUBLIC_EVENTS.indexOf(msgBody.evType) > -1) {
    dispatch(PUBLIC, msgBody.evType, msgBody.message);
    performBroadcast({
      msg: msgBody.message,
      type: msgBody.evType,
      extMsgType: 'broadcast-event.public',
      frameId: (msgBody.frameId || 0),
    })
  }
}



//=================

function performBroadcast({msg, type, extMsgType, frameId = 0}) {
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


function listen(evScope, type, listener) {
  const evTarget = getEvTarget(evScope);
  evTarget.removeEventListener(type, listener);
  evTarget.addEventListener(type, listener);
}


function dispatch(evScope, type, data) {
  const evTarget = getEvTarget(evScope);
  const detailJson = JSON.stringify(data || {})
  const e = new CustomEvent(type, {detail: detailJson});
  evTarget.dispatchEvent(e);
}

function getEvTarget(evScope) {
  switch(evScope) {
    case PUBLIC:
    case PAGE_SCRIPT:
      return document;
    case INTERNAL: {
      let target = document.___mx_wc_internal__;
      if (!target) {
        target = document.createElement('mx-wc-internal');
        document.___mx_wc_internal__ = target;
      }
      return target;
    }
  }
}

function getType(name, evScope) {
  let prefix;
  switch (evScope) {
    case INTERNAL    : prefix = '___.mx-wc.'; break;
    case PAGE_SCRIPT : prefix = '___.mx-wc.page.'; break
    case PUBLIC      : prefix = 'mx-wc.'; break;
  }
  return (prefix + name)
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
  dispatchPageScript,
  listenInternal,
  listenPublic,
  listenPageScript,
}

export default MxWcEvent;
