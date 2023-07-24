"use strict";

import Log           from './lib/log.js';
import T             from './lib/tool.js';
import ExtMsg        from './lib/ext-msg.js';
import MxWcEvent     from './lib/event.js';
import Config        from './lib/config.js';
import RequestParams from './lib/request-params.js'
import Snapshot      from './snapshot/snapshot.js';
import SnapshotMaker from './snapshot/maker.js';

import MxWcAssistantMain from './assistant/main.js';

/*
 * @param {Object} message: {
 *   type, body
 * }
 */
function backgroundMessageHandler(message) {
  return new Promise(function(resolve, reject) {
    switch (message.type) {
      case 'broadcast-event.public':
        MxWcEvent.extMsgReceived(message.body, {isInternal: false});
        resolve();
        break;

      case 'broadcast-event.internal':
        MxWcEvent.extMsgReceived(message.body, {isInternal: true});
        resolve();
        break;

      case 'frame.clipAsHtml.takeSnapshot':
        {
          const blacklist = {SCRIPT: true, TEMPLATE: true};
          const cssBox = getCssBox(message);

          Snapshot.take(window.document, {
            win: window,
            platform: message.body.platform,
            requestParams: getRequestParams(message),
            frameInfo: message.body.frameInfo,
            extMsgType: message.type,
            cssBox: cssBox,
            blacklist: blacklist,
            shadowDom: {blacklist},
            localFrame: {blacklist},
            ignoreFn: (node) => {
              if (node.nodeName.toUpperCase() == 'LINK' && node.rel) {
                const rel = node.rel.toLowerCase();
                if (rel.match(/icon/) || rel.match(/stylesheet/)) {
                  return {isIgnore: false};
                } else {
                  return {isIgnore: true, reason: 'NotSupported'};
                }
              } else {
                return {isIgnore: false}
              }
            }
          }).then((snapshot) => {
            cssBox.setSnapshot(snapshot);
            cssBox.finalize();
            resolve(snapshot);
          }, reject).catch(reject);
        }

        break;

      case 'frame.clipAsMd.takeSnapshot':
        {
          const blacklist = {META: true, HEAD: true, LINK: true,
            STYLE: true, SCRIPT: true, TEMPLATE: true};
          Snapshot.take(window.document, {
            win: window,
            platform: message.body.platform,
            requestParams: getRequestParams(message),
            frameInfo: message.body.frameInfo,
            extMsgType: message.type,
            blacklist: blacklist,
            shadowDom: {blacklist},
            localFrame: {blacklist},
          }).then(resolve, reject).catch(reject);
        }
        break;
      default:
        reject(new Error(`content-frame.js: Unknown message: ${message.type}`));
        break;
    }
  });
}


function getRequestParams(message) {
  const {requestParams} = message.body;
  requestParams.refUrl = window.location.href;
  return new RequestParams(requestParams);
}


function getCssBox(message) {
  const {cssBoxParams} = message.body;
  return Snapshot.createCssBox(Object.assign(
    {node: window.document}, cssBoxParams));
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


/*
 * This global plan will be always applied on every frame.
 */
function getInternalGlobalPlan() {
  return {
    "chAttr": [
      // MathJax V2
      {
        "type": "assign.from.value",
        "pick": "script[id^=MathJax-Element-]",
        "attr": "data-mx-keep",
        "value": "1",
      },
      // MathJax V3
      {
        "type": "assign.from.parent-attr",
        "pick": "mjx-assistive-mml > math",
        "attr": "data-mx-formula-display",
        "tAttr": "display"
      },
      // Normal MathML
      {
        "type": "assign.from-fn.get-math-display",
        "pick": "math",
        "attr": "data-mx-formula-display",
      },
    ]
  };
}


// The background script will send a "ping" message to test
// if the content scirpts have loaded.
function initPingPong() {
  Log.debug("init ping pong...");
  ExtMsg.listen('content.ping', function(message) {
    return new Promise((resolve, _) => {
      if (message.type == 'ping') {
        Log.debug("sending pong");
        resolve('pong');
      }
    });
  });
}


// This script only run in web page and it's external iframes (NOT includes inline iframe)
function init() {

  initPingPong();

  if (document) {
    if (document.documentElement.tagName.toUpperCase() === 'HTML') {
      const isTopFrame = (window === window.top);
      MxWcAssistantMain.listenInternalEvent(isTopFrame);
      initMxWcAssistant();

      if (!isTopFrame) {
        ExtMsg.listen('content-frame', backgroundMessageHandler);
        MxWcEvent.init(ExtMsg);
      }

      MxWcEvent.dispatchInternal(
        'assistant.apply-plan-global',
        getInternalGlobalPlan()
      );

    } else {
      // feed or others
    }
  }
}

init();
Log.debug("content frame init...");

