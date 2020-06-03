"use strict";

import T from './tool.js';
import ExtApi from './ext-api.js';

//const browser = require('webextension-polyfill');

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
 * extention page. We put page name in each message, so we can know what
 * page did each message is sent to.
 *
 *
 * Message Structure
 *
 *   target : target page name (required)
 *   type   : message type (required)
 *   body   : message body (optional)
 *
 */


/*
 * @param {function} listener
 * @param {string} currPage
 *   listener should return a promise.
 */
function listen(listener, currPage) {
  browser.runtime.onMessage.addListener((msg, sender, senderResponse) => {
    // Deprecated: senderResponse
    if(msg.target == currPage) {
      return listener(msg, sender);
    } else {
      console.debug("[OtherPageMsg]"," Im: ", currPage, "Msg Target:", msg.target, msg);
      // ignore msg
    }
  });
}

function sendToBackground(msg) {
  return browser.runtime.sendMessage(
    addPage('background', msg));
}

function sendToContent(msg, tabId, frameId) {
  return sendToTab(addPage('content', msg),
    tabId, frameId);
}

function sendToContentFrame(msg, tabId, frameId) {
  return sendToTab(addPage('content-frame', msg),
    tabId, frameId);
}

function sendToPage(msg, pageUrl) {
  if(!msg.target) { throw new Error("Message invalid: target page is requred.")}
  eachTab((tab) => {
    if(tab.url.startsWith(pageUrl)) {
      sendToTab(msg, tab.id);
    }
  });
}

function broadcastToContent(msg) {
  eachTab((tab) => {
    if(!T.isExtensionUrl(tab.url)) {
      sendToTab(addPage('content', msg), tab.id)
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
function addPage(targetPage, msg) {
  return Object.assign(msg, {target: targetPage});
}

// private
function sendToTab(msg, tabId, frameId) {
  const defaultFrameId = 0;
  const options = {frameId: defaultFrameId};
  if(frameId) { options.frameId = frameId }
  return new Promise(function(resolve, _){
    if(tabId){
      browser.tabs.sendMessage(tabId, msg, options)
        .then(resolve)
        .catch((err) => {
          console.log(tabId, options.frameId);
          console.log(msg);
          console.error(err);
          console.trace();
          resolve(undefined);
        })
    }else{
      ExtApi.getCurrentTab().then((tab) => {
        browser.tabs.sendMessage(tab.id, msg, options)
          .then(resolve)
          .catch((err) => {
            console.log(tabId, options.frameId);
            console.log(msg);
            console.error(err);
            console.trace();
            resolve(undefined);
          })
      })
    }
  })
}

const ExtMsg = {
  listen: listen,
  sendToBackground: sendToBackground,
  sendToContent: sendToContent,
  sendToContentFrame: sendToContentFrame,
  sendToPage: sendToPage,
  broadcastToContent: broadcastToContent,
}

export default ExtMsg;
