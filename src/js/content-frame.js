(function() {
  "use strict";

  /*
   * @param {Object} message: {
   *   fold, mimeTypeDict
   * }
   */
  function messageHandler(message) {
    return new Promise(function(resolve, reject) {
      if (message.to === window.location.href) {
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
    const {id, frames, fold, assetFold, assetRelativePath, mimeTypeDict} = message.body;
    return {
      id: id,
      win: window,
      frames: frames,
      fold: fold,
      assetFold: assetFold,
      assetRelativePath: assetRelativePath,
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
    }
  }

  init();


})();
