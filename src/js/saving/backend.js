
import Log from '../lib/log.js';
import ExtMsg from '../lib/ext-msg.js';
import MxWcConfig from '../lib/config.js';
import MxWcStorage from '../lib/storage.js';
import MxWcIcon from '../lib/icon.js';

function messageHandler(message, sender){
  return new Promise(function(resolve, reject){
    switch(message.type) {
      case 'save':
        saveClipping(sender.tab.id, message.body);
        resolve();
        break;
      case 'complete':
        completeSaving(sender.tab.id, message.body);
        break;
    }
  });
}

async function saveClipping(tabId, clipping) {
  const handler = await getClippingHandler();
  const feedback = function(msg) {
    switch(msg.type) {
      case 'started':
        started(tabId, msg);
        break;
      case 'progress':
        progress(tabId, msg);
        break;
      case 'completed':
        completed(tabId, msg.clippingResult, handler);
        break;
      default: break;
    }
  }
  handler.saveClipping(clipping, feedback);
}


function started(tabId, msg) {
  Log.debug('started');
  ExtMsg.sendToContent({
    type: 'saving.started',
    body: {
      clipId: msg.clipId
    }
  }, tabId);
}

function progress(tabId, msg) {
  const progress = [msg.finished, msg.total].join('/');
  Log.debug('progress', progress);
  ExtMsg.sendToContent({
    type: 'saving.progress',
    body: {
      clipId: msg.clipId,
      finished: msg.finished,
      total: msg.total
    }
  }, tabId);
}

function completed(tabId, result, handler){
  Log.debug('completed');
  // compatible with old message
  result.handler = handler.name;
  result = handler.handleClippingResult(result);
  Log.debug(result);
  completeSaving(tabId, result);
}

// ========================================

function completeSaving(tabId, result) {
  updateClippingHistory(result);
  ExtMsg.sendToContent({
    type: 'saving.completed',
    body: result
  }, tabId);
  MxWcStorage.set('lastClippingResult', result);
  MxWcIcon.flicker(3);
  // FIXME
  // generateClippingJsIfNeed();
}

function updateClippingHistory(clippingResult) {
  MxWcStorage.get('clips', [])
    .then((v) => {
      const idx = v.findIndex((it) => {
        return it.clipId == clippingResult.clipId;
      });
      if(idx > -1) {
        Log.debug("UpdateClippingHistory", clippingResult.url);
        v[idx]['url'] = clippingResult.url;
        MxWcStorage.set('clips', v);
      }
    });
}

async function getClippingHandler() {
  const config = await MxWcConfig.load();
  const name = ['Handler', config.clippingHandler].join('_');
  return Global[name] || Global.Handler_Browser;
}

/*
 *
 * @param {Object} global {
 *   :Handler_Browser,
 *   :Handler_NativeApp,
 *   :Handler_WizNotePlus
 * }
 */
let Global = null;
export default function init(global) {
  Global = global;
  ExtMsg.listen('backend.saving', messageHandler);
  Log.debug("MX backend: Saving initialized");
}
