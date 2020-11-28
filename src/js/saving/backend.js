
import Log         from '../lib/log.js';
import ExtMsg      from '../lib/ext-msg.js';
import MxWcConfig  from '../lib/config.js';
import MxWcStorage from '../lib/storage.js';
import MxWcIcon    from '../lib/icon.js';

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
      case 'retry.task':
        retryTask(sender.tab.id, message.body)
        resolve();
        break;
    }
  });
}

async function retryTask(tabId, task) {
  const handler = await getClippingHandler();
  const sendErrorFeedback = function(errMsg) {
    ExtMsg.sendToExtPage('failed-tasks', {
      type: 'retry.task.feedback',
      body: {
        type: 'failed',
        clipId: task.clipId,
        taskFilename: task.filename,
        errMsg: errMsg,
      }
    });
  }

  handler.getInfo((info) => {
    if (info.ready) {
      if (handler.retryTask) {
        const feedback = function(msg) {
          ExtMsg.sendToExtPage('failed-tasks', {
            type: 'retry.task.feedback',
            body: msg
          });
        }
        handler.retryTask(task, feedback)
      } else {
        sendErrorFeedback(`Handler: ${handler.name} doesn't support retryTask`);
      }
    } else {
      sendErrorFeedback(`Handler: ${handler.name} not ready`);
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
  const type = 'saving.completed';
  updateClippingHistory(result);
  ExtMsg.sendToContent({
    type: type,
    body: result
  }, tabId);
  MxWcStorage.set('lastClippingResult', result);
  if (result.failedTaskNum > 0) {
    // save failed tasks
    MxWcStorage.get('failedTasks', [])
      .then((tasks) => {
        MxWcStorage.set('failedTasks', result.failedTasks.concat(tasks));
      });
  }
  MxWcIcon.flicker(3);
  Global.evTarget.dispatchEvent({type: type, result: result})
}

function updateClippingHistory(result) {
  MxWcStorage.get('clips', [])
    .then((v) => {
      const idx = v.findIndex((it) => {
        return it.clipId == result.clipId;
      });
      if(idx > -1) {
        Log.debug("UpdateClippingHistory", result.url);
        v[idx]['url'] = result.url;
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
 *   :evTarget,
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
