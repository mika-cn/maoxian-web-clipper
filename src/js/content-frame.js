"use strict";

import Log           from './lib/log.js';
import T             from './lib/tool.js';
import ExtMsg        from './lib/ext-msg.js';
import MxWcEvent     from './lib/event.js';
import Config        from './lib/config.js';
import RequestParams from './lib/request-params.js'

import MxHtmlClipper     from './clipping/clip-as-html.js';
import MxMarkdownClipper from './clipping/clip-as-markdown.js';

import MxWcAssistantMain from './assistant/main.js';

/*
 * @param {Object} message: {
 *   type, body
 * }
 */
function backgroundMessageHandler(message) {
  return new Promise(function(resolve, reject) {
    // FIXME
    //
    // what if the frame src atribute is not exist
    // it's content set by srcdoc attribute
    //
    switch (message.type) {
      case 'broadcast-event.public':
        MxWcEvent.extMsgReceived(message.body, {isInternal: false});
        resolve();
        break;
      case 'broadcast-event.internal':
        MxWcEvent.extMsgReceived(message.body, {isInternal: true});
        resolve();
        break;
      case 'frame.toHtml':
        MxHtmlClipper.getElemHtml(getParams(message)).then((result) => {
          result.title = window.document.title;
          resolve(result);
        });
        break;
      case 'frame.toMd':
        MxMarkdownClipper.getElemHtml(getParams(message)).then(resolve);
        break;
    }
  });
}

function getParams(message) {
  const {clipId, frames, storageInfo, config} = message.body;

  const requestParams = new RequestParams({
    refUrl         : window.location.href,
    userAgent      : window.navigator.userAgent,
    referrerPolicy : config.requestReferrerPolicy,
    timeout        : config.requestTimeout,
    tries          : config.requestMaxTries,
  });

  storageInfo.assetRelativePath = T.calcPath(
    storageInfo.frameFileFolder, storageInfo.assetFolder
  );

  return {
    clipId: clipId,
    frames: frames,
    storageInfo: storageInfo,
    elem: window.document.body,
    docUrl: window.location.href,
    baseUrl: window.document.baseURI,
    parentFrameId: message.frameId,
    config: config,
    requestParams: requestParams,
    needFixStyle: false,
    win: window,
  }
}

function initMxWcAssistant() {
  Config.load().then((config) => {
    if (config.assistantEnabled) {
      MxWcAssistantMain.init();
    } else {
      Log.debug("Assistant disabled");
    }
  });
}

// This script only run in web page and it's external iframes (NOT includes inline iframe)
function init() {
  if (document) {
    if (document.documentElement.tagName.toUpperCase() === 'HTML') {
      if(window === window.top){
        // Main window
        MxWcAssistantMain.listenInternalEvent();
        initMxWcAssistant();
      }else{
        // Iframe
        initMxWcAssistant();
        ExtMsg.listen('content-frame', backgroundMessageHandler);
        MxWcEvent.init(ExtMsg);
      }
    } else {
      // feed or others
    }
  }
}

init();

