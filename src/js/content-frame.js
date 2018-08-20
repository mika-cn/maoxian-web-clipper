(function() {
  "use strict";

  // use href as identify
  const id = window.location.href;

  /*
   * @param {Object} message: {
   *   fold, mimeTypeDict
   * }
   */
  function messageHandler(message) {
    return new Promise(function(resolve, reject) {
      if (message.to === id) {
        switch (message.type) {
          case 'frame.toHtml':
            MxWcHtml.getElemHtml(getParams(message), resolve);
            break;
          case 'frame.toMd':
            MxWcMarkdown.getElemHtml(getParams(message), resolve)
            break;
        }
      }
    });
  }

  function getParams(message) {
    const {frames, fold, mimeTypeDict} = message.body;
    return {
      win: window,
      frames: frames,
      fold: fold,
      elem: document.body,
      refUrl: window.location.href,
      mimeTypeDict: mimeTypeDict,
      parentFrameId: message.frameId
    }
  }

  function init() {
    if(window === window.top){
      // Main window
    }else{
      // Iframe
      ExtApi.addMessageListener(messageHandler);
      Window.add
    }
  }

  init();


})();
