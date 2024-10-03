"use strict";

(function (root, factory) {
  /**
   * Note that: if we reload the extension, then clip a web page that loaded
   * before. window.FrameTool is undefined.
   */
  window.FrameTool = factory(root, root.chrome)
})(this, function(root, ExtApi) {

  async function getId(frameWindow, targetOrigin = '*') {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => {
        // could not reach some target frames (due to errors,
        // e.g: Could not establish connection, receivig end does not exist)
        resolve(null)
        channel.port1.close();
        console.debug("timeout getting frame id");
      }, 2000);

      channel.port1.onmessage = (ev) => {
        const {frameId} = ev.data;
        resolve(frameId);
        clearTimeout(timeout);
        channel.port1.close();
      }

      const message = {token: state.token};
      const transferableObjs = [channel.port2];
      frameWindow.postMessage(
        message,
        targetOrigin,
        transferableObjs
      );
    });
  }


  function listenMessageAsChildFrame() {
    if (window !== window.top) {
      const useCapture = false;
      window.addEventListener(
        'message',
        receiveWindowMessageFromParentFrame,
        useCapture
      );
    }
  }

  function receiveWindowMessageFromParentFrame(event) {
    const {token} = event.data;
    if (token && token == state.token) {
      // valid message
      const port2 = event.ports[0];
      getFrameIdThroughBg().then((frameId) => {
        port2.postMessage({frameId});
      })
    } else {
      event.ports[0].postMessage({frameId: null});
    }
  }


  async function getFrameMsgToken() {
    const key  = 'frame-msg-token';
    const data = await ExtApi.storage.session.get(key);
    return data[key];
  }

  async function getFrameIdThroughBg() {
    return ExtApi.runtime.sendMessage({
      target: 'background',
      type: 'get.frame-id',
    });
  }

  const state = {};
  function init() {
    getFrameMsgToken().then((token) => {
      state.token = token;
      listenMessageAsChildFrame();
    });
  }

  init();

  return {getId};
});


