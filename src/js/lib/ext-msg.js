"use strict";

import T      from './tool.js';
import ExtApi from './ext-api.js';


/*!
 *   All extension page (popup page, background page, option page etc.)
 * can receive message which is sent by browser.runtime.sendMessage().
 *
 *   If a page renders inside a tab, it can receive message which is sent
 * by browser.tabs.sendMessage(). Generally, popup page can't receive this
 * message. but if it renders inside a tab (like firefox for android did).
 * It also can receive this message.
 *
 *   Things can get very confused, especially when we send message between
 * extention page. We put target name in each message, so we can know
 * where each message is sent to.
 *
 *
 * Message Structure
 *
 *   target : target name (required) - A page may have more than one target.
 *   type   : message type (required)
 *   body   : message body (optional)
 *
 */


/*
 * When an error is rejected through backend,
 * some browsers (like Firefox) lost the stack info
 * So we pass the stack info to frontend.
 */
function wrapBackendListener(listener) {
  return async function backendMessageListenerWithBetterError(message, sender) {
    try {
      const result = await listener(message, sender)
      return result;
    } catch (e) {
      console.debug(e)
      const message = [`${e.name}: ${e.message}`, 'backend stack: ', e.stack].join("\n");
      throw new Error(message, {cause: e});
    }
  }
}


/*
 * @param {string} target
 * @param {function} listener
 *   listener should return a promise.
 */
function listen(target, listener) {
  browser.runtime.onMessage.addListener((msg, sender, senderResponse) => {
    // Deprecated: senderResponse
    if(msg.target == target) {
      return listener(msg, sender);
    } else {
      // console.debug("[OtherPageMsg]"," Listening to ", target, ", but Msg's target is", msg.target, msg);

      // Returns false or undefined means this message listener
      // don't care this message and let other listeners handle it.
      return false;
    }
  });
}

function listenBackend(target, listener) {
  listen(target, wrapBackendListener(listener));
}

function sendToBackground(msg) {
  return sendToExtPage('background', msg);
}

function sendToBackend(name, msg) {
  return sendToExtPage(['backend', name].join('.'), msg);
}

function pingContentScript(tabId, frameId) {
  const msg = {type: 'ping'};
  return sendToTab(addTarget('content.ping', msg),
    tabId, frameId);
}

function sendToContent(msg, tabId, frameId) {
  return sendToTab(addTarget('content', msg),
    tabId, frameId);
}

function sendToContentFrame(msg, tabId, frameId) {
  return sendToTab(addTarget('content-frame', msg),
    tabId, frameId);
}

function sendToExtPage(target, msg) {
  return browser.runtime.sendMessage(addTarget(target, msg));
}

function sendToPage(msg, pageUrl) {
  if(!msg.target) { throw new Error("Message invalid: target page is required.")}
  eachTab((tab) => {
    if(tab.url.startsWith(pageUrl)) {
      sendToTab(msg, tab.id);
    }
  });
}

function broadcastToContent(msg) {
  eachTab((tab) => {
    if(!T.isBrowserExtensionUrl(tab.url)) {
      sendToTab(addTarget('content', msg), tab.id)
    }
  });
}


// private
function eachTab(callback) {
  ExtApi.getAllTabs().then((tabs) => {
    tabs.forEach(callback);
  });
}

// private
function addTarget(target, msg) {
  return Object.assign(msg, {target});
}


const IGNORE_MSG_ERROR = {ping: true, 'page_content.changed': true};

// private
function sendToTab(msg, tabId, frameId) {
  const defaultFrameId = 0;
  const options = {frameId: defaultFrameId};
  if(frameId) { options.frameId = frameId }
  return new Promise(function(resolve, reject){
    const createErrorHandler = (msg, tabId, frameId) => {
      return (err) => {
        if (IGNORE_MSG_ERROR[msg.type]) {
          console.debug('ignored tab msg: ', msg.type)
          //console.debug(err);
          resolve('ignored');
        } else {
          console.warn(tabId, options.frameId);
          console.warn(msg);
          console.warn(err);
          // stack removed by browser
          // console.warn(err.stack);
          console.trace();
          reject(err);
        }
      }
    }
    if(tabId){
      const errorHandler = createErrorHandler(msg, tabId, options.frameId);
      browser.tabs.sendMessage(tabId, msg, options)
        .then(resolve, errorHandler)
    } else {
      let errorHandler = () => { resolve() };
      ExtApi.getCurrentTab().then((tab) => {
        if (tab) {
          errorHandler = createErrorHandler(msg, tab.id, options.frameId);
          browser.tabs.sendMessage(tab.id, msg, options)
            .then(resolve, errorHandler);
        } else {
          console.debug("Error, Can't get current tab");
          console.debug("Ignore this tab msg: ", msg.type);
          resolve("ignored");
        }
      }, errorHandler)
    }
  })
}

const ExtMsg = {
  listen,
  listenBackend,
  sendToBackend,
  sendToBackground,
  pingContentScript,
  sendToContent,
  sendToContentFrame,
  sendToPage,
  sendToExtPage,
  broadcastToContent,
}

export default ExtMsg;
