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
    console.log(message);
    return new Promise(function(resolve, reject) {
      if (message.to === id) {
        console.log(message.type, id);
        switch (message.type) {
          case 'frame.toHtml':
            const params = getParams(message);
            MxWcHtml.getElemHtml(params, resolve);
            break;
          case 'frame.toMd':
            const params = getParams(message);
            MxWcMarkdown.getElemHtml(params, resolve)
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
