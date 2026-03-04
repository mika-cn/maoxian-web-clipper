
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
        const {script, args = []} = message.body;
        executeScript(script, args, {
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

async function executeScript(scriptName, args, {tabId, frameId}) {
  throw new Error("execute user scripts is not supported yet (manifest V3)");
  // We are waiting for userScripts.execute method to be implement
  // by browsers.

  /*
  const script = await getWrappedScript(scriptName, args);
  return  ExtApi.executeContentScript(tabId, {
    frameId, code: script, runAt: 'document_idle'});
    */
}


async function getWrappedScript(scriptName, args = []) {
  const argsJson = JSON.stringify(args);
  const userScript = await getUserScript(scriptName);
  const script = `(() => {"use strict";
    const __mx_execute_fn = function (userScript, args, window, browser, chrome) {
      try {
        ${userScript.code}
        return {ok: true};
      } catch(e) {
        const error = {name: e.name, msg: e.message, stack: e.stack};
        return {ok: false, error};
      }
    };

    const myWindow = Object.assign({}, window);
    delete myWindow.browser;
    delete myWindow.chrome;
    const userScript = {name: "${userScript.name}", version: "${userScript.version}"};
    const context = myWindow;
    const args = ${argsJson};
    const exposedValues = [userScript, args, myWindow];
    const r = __mx_execute_fn.call(context, ...exposedValues);
    if (!r.ok) {
      console.error("${userScript.name}", r.error.name, r.error.msg);
      console.error("Line number offset: 3");
      console.error(r.error.stack)
    }
  })();
  `;
  return script;
}


async function getUserScript(scriptName) {
  const key = ['user-script', 'script', scriptName].join('.');
  const script = await Storage.get(key);
  if (script) {
    return script;
  } else {
    throw new Error("Could not find script with name: " + scriptName);
  }
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
