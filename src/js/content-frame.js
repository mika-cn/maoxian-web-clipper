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
          const cssBox = getCssBox(message);

          // save icons and stylesheets only
          const ignoreFn = (node) => {
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

          const domParams_html = {
            frameInfo: message.body.frameInfo,
            extMsgType: message.type,
            cssBox: cssBox,
            blackList: {SCRIPT: true, TEMPLATE: true},
            ignoreFn,
          }

          const domParams            = Object.assign({}, domParams_html);
          const domParams_localFrame = Object.assign({}, domParams_html);
          const domParams_shadow     = Object.assign({}, domParams_html);
          const domParams_svg = {blacklist: {SCRIPT: true, LINK: true}};

          Snapshot.take(window.document, {
            win: window,
            platform: message.body.platform,
            requestParams: getRequestParams(message),
            domParams,
            domParams_html,
            domParams_localFrame,
            domParams_shadow,
            domParams_svg,
          }).then((snapshot) => {
            cssBox.setSnapshot(snapshot);
            cssBox.finalize();
            resolve(snapshot);
          }, reject).catch(reject);
        }

        break;

      case 'frame.clipAsMd.takeSnapshot':
        {
          const domParams_html = {
            frameInfo: message.body.frameInfo,
            extMsgType: message.type,
            blacklist: {META: true, HEAD: true, LINK: true, STYLE: true, SCRIPT: true, TEMPLATE: true}
          }

          const domParams            = Object.assign({}, domParams_html);
          const domParams_localFrame = Object.assign({}, domParams_html);
          const domParams_shadow     = Object.assign({}, domParams_html);
          const domParams_svg = {blacklist: {SCRIPT: true, LINK: true}};

          Snapshot.take(window.document, {
            win: window,
            platform: message.body.platform,
            requestParams: getRequestParams(message),
            domParams,
            domParams_html,
            domParams_localFrame,
            domParams_shadow,
            domParams_svg,
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
    actions: [
      // MathJax V2
      {
        chAttr: {
          pick: "script[id^=MathJax-Element-]",
          type: "assign.from.value",
          attr: "data-mx-keep",
          value: "1",
        },
        tag: 'md-only'
      },

      // MathJax V3
      {
        chAttr: {
          pick: "mjx-assistive-mml > math",
          type: "assign.from.parent-attr",
          attr: "data-mx-formula-display",
          tAttr: "display"
        },
        tag: 'md-only'
      },

      // Normal MathML
      {
        chAttr: {
          pick: "math",
          type: "assign.from-fn.get-math-display",
          attr: "data-mx-formula-display",
        },
        tag: 'md-only'
      }
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

