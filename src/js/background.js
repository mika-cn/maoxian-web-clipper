


function messageHandler(message, sender, senderResponse){
  // Deprecated: senderResponse
  return new Promise(function(resolve, reject){
    switch(message.type){
      case 'get.mimeTypeDict' : WebRequest.getMimeTypeDict(resolve)     ; break     ;
      case 'init.downloadFold': initDownloadFold()                      ; resolve() ; break ;
      case 'save.category'    : saveCategory(message.body)              ; resolve() ; break ;
      case 'save.tags'        : saveTags(message.body)                  ; resolve() ; break ;
      case 'save.clip'        : saveClip(message.body)                  ; resolve() ; break ;

      case 'reset.clips'      : resetStates('clips', message.body)      ; resolve() ; break ;
      case 'reset.categories' : resetStates('categories', message.body) ; resolve() ; break ;
      case 'reset.tags'       : resetStates('tags', message.body)       ; resolve() ; break ;
      case 'keyStore.start':
        keyStoreService.start(resolve);
        break;
      case 'keyStore.add':
        keyStoreService.add(message.body.key, resolve);
        break;
      case 'keyStore.reset':
        keyStoreService.reset();
        resolve();
        break;
      case 'taskStore.start':
        taskStoreService.start(resolve);
        break;
      case 'taskStore.add':
        taskStoreService.add(message.body, resolve);
        break;
      case 'taskStore.getResult':
        taskStoreService.getResult(resolve);
        break;
      case 'taskStore.reset':
        taskStoreService.reset();
        resolve();
        break;
      case 'handle.clipping':
        handleClipping(sender.tab.id, message.body);
        resolve();
        break;
      case 'get.allFrames':
        ExtApi.getAllFrames(sender.tab.id)
          .then(resolve);
        break;
      case 'frame.toHtml':
      case 'frame.toMd':
        // send back
        ExtApi.sendMessageToContent(message, sender.tab.id, message.frameId)
          .then((data) => {
            resolve(data);
          });
        break;

      default: break;
    }
  });
}

function handleClipping(tabId, clipping){
  getClippingHandler((handler) => {
    handler.setCompletedAction(onCompleted);
    handler.init(tabId, clipping.clipId);
    handler.handle(clipping.tasks);
  });
}

function getClippingHandler(callback) {
  MxWcConfig.load().then((config) => {
    let handler = null;
    switch(config.clippingHandlerName){
      case 'browser':
        handler = ClippingHandler_Browser;
        break;
      case 'native-app':
        handler = ClippingHandler_NativeApp;
        break;
      default:
        handler = ClippingHandler_Browser;
    }
    callback(handler);
  })
}

function onCompleted(tabId, clippingResult){
  ExtApi.sendMessageToContent({ type: 'download.completed'}, tabId);
  MxWcStorage.set('lastClippingResult', clippingResult);
  MxWcIcon.flicker(3);
}

function initDownloadFold(){
  MxWcStorage.get('downloadFold').then((root) => {
    if(!root){
      getClippingHandler((handler) => {
        handler.initDownloadFold();
      });
    }
  });
}

function resetStates(key, states){
  MxWcStorage.set(key, states);
}

function saveClip(msg){
  const clip = msg.clip;
  MxWcStorage.get('clips', [])
    .then((v) => {
      v.unshift(clip);
      MxWcStorage.set('clips', v);
    })
}

function saveTags(msg){
  const tags = msg.tags;
  MxWcStorage.get('tags', [])
    .then((v) => {
      T.each(tags, function(tag){
        v = T.remove(v, tag);
      });
      T.each(tags, function(tag){
        v.unshift(tag);
      });
      MxWcStorage.set('tags', v);
    });
}

function saveCategory(msg){
  const category = msg.category;
  MxWcStorage.get('categories', [])
    .then((v) => {
      v = T.remove(v, category);
      v.unshift(category);
      MxWcStorage.set('categories', v);
    })
}




function createKeyStoreService(){
  const service = createLockService(10);

  function add(key, callback){
    service.get((state) => {
      const canAdd = (state.keys.has(key) ? false : true);
      state.keys.add(key);
      Log.debug('KeyStore.add: ', key, canAdd);
      callback(canAdd);
    });
  }

  function start(callback){
    Log.debug('keyStore.start');
    service.start();
    service.get((state) => {
      state.keys = new Set();
      callback()
    });
  }

  function reset(){
    Log.debug('keyStore.reset');
    service.stop();
  }

  return {
    start: start,
    reset: reset,
    add: add
  };
}

function createTaskStoreService(){
  const service = createLockService(10);

  function add(task, callback){
    Log.debug('taskStore.add')
    service.get((state) => {
      state.tasks.push(task);
      callback();
    });
  }

  function start(callback) {
    Log.debug('taskStore.start');
    service.start();
    service.get((state) => {
      state.tasks = [];
      callback();
    });
  }

  function getResult(callback) {
    Log.debug('taskStore.getResult');
    service.last((state) => {
      callback(state.tasks);
    })
  }

  function reset() {
    Log.debug('taskStore.reset');
    service.stop();
  }

  return {
    start: start,
    add: add,
    getResult: getResult,
    reset: reset
  }
}

// state
let keyStoreService = null;
let taskStoreService = null;
function init(){
  WebRequest.listen();
  keyStoreService = createKeyStoreService();
  taskStoreService = createTaskStoreService();
  ExtApi.addMessageListener(messageHandler);
  Log.debug("background init...");
}

init();
