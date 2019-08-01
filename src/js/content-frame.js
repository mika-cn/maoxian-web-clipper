;(function(root, factory) {
  factory(
    root.MxWcLog,
    root.MxWcExtMsg,
    root.MxWcFrameMsg,
    root.MxWcEvent,
    root.MxWcHtml,
    root.MxWcMarkdown
  );
})(this, function(Log, ExtMsg, FrameMsg, MxWcEvent,
    MxWcHtml, MxWcMarkdown, undefined) {
  "use strict";

  /*
   * @param {Object} message: {
   *   fold, mimeTypeDict
   * }
   */
  function backgroundMessageHandler(message) {
    return new Promise(function(resolve, reject) {
      if (message.frameUrl === window.location.href) {
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
    const {clipId, frames, path, mimeTypeDict, config} = message.body;
    return {
      clipId: clipId,
      frames: frames,
      path: path,
      elem: document.body,
      refUrl: window.location.href,
      mimeTypeDict: mimeTypeDict,
      parentFrameId: message.frameId,
      config: config,
    }
  }

  function listenBackgroundMessage() {
    ExtMsg.initPage('content-frame');
    ExtMsg.listen(backgroundMessageHandler);
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


});
