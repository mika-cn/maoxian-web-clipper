(function() {
  "use strict";

  /*
   * @param {Object} message: {
   *   fold, mimeTypeDict
   * }
   */
  function backgroundMessageHandler(message) {
    return new Promise(function(resolve, reject) {
      if (message.to === window.location.href) {
        switch (message.type) {
          case 'frame.toHtml':
            MxWcHtml.getElemHtml(getParams(message)).then(resolve);
            break;
          case 'frame.toMd':
            MxWcMarkdown.getElemHtml(getParams(message)).then(resolve);
            break;
        }
      }
    });
  }

  function getParams(message) {
    const {clipId, frames, path, mimeTypeDict, saveWebFont, saveCssImage} = message.body;
    return {
      clipId: clipId,
      frames: frames,
      path: path,
      elem: document.body,
      refUrl: window.location.href,
      mimeTypeDict: mimeTypeDict,
      parentFrameId: message.frameId,
      saveWebFont: saveWebFont,
      saveCssImage: saveCssImage
    }
  }

  function listenBackgroundMessage() {
    ExtApi.addMessageListener(backgroundMessageHandler);
  }

  function listenFrameMessage() {
    FrameMsg.init({
      id: window.location.href,
      origin: window.location.origin
    });
    MxWcEvent.handleBroadcast();
  }

  function init() {
    if(window === window.top){
      // Main window
    }else{
      // Iframe
      listenBackgroundMessage();
      listenFrameMessage();
    }
  }

  init();


})();
