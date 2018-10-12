


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
      case 'keyStore.init':
        keyStoreService.init(resolve);
        break;
      case 'keyStore.add':
        keyStoreService.add(message.body.key, resolve);
        break;
      case 'save.task':
        saveTask(sender.tab.id, message.body);
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

function saveTask(tabId, task){
  getClippingHandler((handler) => {
    handler.setCompletedAction(onCompleted);
    handler.init(tabId, task.clipId);
    handler.handle(task);
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
  const queue = T.createFunQueue();

  function add(key, callback){
    queue.enqueue((state) => {
      const canAdd = (state.keys.has(key) ? false : true);
      state.keys.add(key);
      callback(canAdd);
    });
  }

  function init(callback) {
    queue.enqueue((state) => {
      state.keys = new Set();
      callback();
    });
  }

  return {
    init: init,
    add: add
  };
}

function welcomeNewUser(){
  MxWcStorage.get('firstRunning', true)
    .then((firstRunning) => {
      if(firstRunning){
        MxWcStorage.set('firstRunning', false)
        ExtApi.createTab(MxWcLink.get('extPage.welcome'));
      }
    })
}

// state
let keyStoreService = null;
function init(){
  WebRequest.listen();
  keyStoreService = createKeyStoreService();
  ExtApi.addMessageListener(messageHandler);
  Log.debug("background init...");
  welcomeNewUser();
}

init();
