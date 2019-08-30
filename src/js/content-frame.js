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
      // FIXME
      //
      // what if the frame src atribute is not exist
      // it's content set by srcdoc attribute
      //
      // Actually, this message is sent to this frame
      // by background.js
      // Maybe it's safe to remove this "if".
      //
      if (message.frameUrl === window.location.href) {
        switch (message.type) {
          case 'frame.toHtml':
            MxWcHtml.getElemHtml(getParams(message)).then((result) => {
              result.title = window.document.title;
              resolve(result);
            });
            break;
          case 'frame.toMd':
            MxWcMarkdown.getElemHtml(getParams(message)).then(resolve);
            break;
        }
      }
    });
  }

  function getParams(message) {
    const {clipId, frames, storageInfo, mimeTypeDict, config} = message.body;

    //FIXME
    const headers = {
      "Referer"    : window.location.href,
      "Origin"     : window.location.origin,
      "User-Agent" : window.navigator.userAgent
    }

    return {
      clipId: clipId,
      frames: frames,
      storageInfo: storageInfo,
      elem: window.document.body,
      docUrl: window.location.href,
      baseUrl: window.document.baseURI,
      mimeTypeDict: mimeTypeDict,
      parentFrameId: message.frameId,
      config: config,
      headers: headers,
      needFixStyle: false,
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

  // This script only run in web page and it's external iframes (NOT includes inline iframe)
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
