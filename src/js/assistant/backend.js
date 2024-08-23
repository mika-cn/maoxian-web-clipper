
import Log            from '../lib/log.js';
import T              from '../lib/tool.js';
import ExtApi         from '../lib/ext-api.js';
import ExtMsg         from '../lib/ext-msg.js';
import Storage        from '../lib/storage.js';
import PlanRepository from './plan-repository.js';


const asyncFunQueue = T.createAsyncFnQueue();

function messageHandler(message, sender) {
  return new Promise((resolve, reject) => {
    switch(message.type){
      case 'get.plan':
        asyncFunQueue.enqueue(async () => {
          PlanRepository.get(message.body.url).then(resolve);
        });
        break;
      case 'update.public-plan':
        PlanRepository.updatePublicPlans(message.body.urls).then(resolve);
        break;
      case 'save.global-plan':
        PlanRepository.updateGlobalPlan(message.body.planText).then(resolve);
        break;
      case 'save.custom-plan':
        PlanRepository.updateCustomPlans(message.body.planText).then(resolve);
        break;
      case 'restart':
        PlanRepository.restart();
        resolve();
        break;
      case 'execute.script':
        const {scriptId, args = []} = message.body;
        executeScript(scriptId, args, {
          tabId: sender.tab.id,
          frameId: sender.frameId
        }).then(resolve, reject);
        break;
      default:
        reject(new Error(`assistant/backend.js: Unknown message: ${message.type}`));
        break;
    }
  });
}

function executeScript(scriptId, args, {tabId, frameId}) {
  const script = getScript(scriptId, args);
  return  ExtApi.executeContentScript(tabId, {
    frameId, code: script, runAt: 'document_idle'});
}


function getScript(scriptId, args = []) {
  const argsJson = JSON.stringify(args);
  const code = getCode(scriptId);
  const script = `(() => {"use strict";
    const __mx_execute_fn = function (args, window, browser, chrome) {
      try {
        ${code}
        return {ok: true};
      } catch(e) {
        const error = {name: e.name, msg: e.message, stack: e.stack};
        return {ok: false, error};
      }
    };

    const myWindow = Object.assign({}, window);
    delete myWindow.browser;
    delete myWindow.chrome;
    const script = {id: "${scriptId}"};
    const context = Object.assign({script}, myWindow);
    const args = ${argsJson};
    const exposedValues = [args, myWindow];
    const r = __mx_execute_fn.call(context, ...exposedValues);
    if (!r.ok) {
      console.error("${scriptId}", r.error.name, r.error.msg);
      console.error("Line number offset: 3");
      console.error(r.error.stack)
    }
  })();
  `;
  return script;
}


// FIXME
function getCode(scriptId) {
  return `console.debug('hi ${scriptId},', args);`
}



/*
 * @param {Object} global
 *   - {Fetcher} Fetcher
 */
export default function init(global) {
  ExtMsg.listenBackend('backend.assistant', messageHandler);
  PlanRepository.init(global);
  Log.debug("MX backend: Assistant initialized");
}
