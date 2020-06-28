
import Log from '../lib/log.js';
import T from '../lib/tool.js';
import ExtMsg from '../lib/ext-msg.js';
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
      case 'save.custom-plan':
        PlanRepository.updateCustomPlans(message.body.planText).then(resolve);
        break;
    }
  });
}

export default function init() {
  ExtMsg.listen('backend.assistant', messageHandler);
  PlanRepository.init();
  Log.debug("MX backend: Assistant initialized");
}
