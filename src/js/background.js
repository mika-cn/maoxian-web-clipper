


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
      case 'fetch.text':
        Fetcher.get('text', message.body.url, message.body.headers).then(resolve, reject);
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

      case 'export.history':
        exportHistory(message.body.content);
        resolve();
        break;
      case 'clipping.save':
        saveClipping(sender.tab.id, message.body);
        resolve();
        break;
      case 'clipping.delete':
        deleteClipping(message.body, resolve);
        break;
      case 'generate.clipping.js':
        generateClippingJs(resolve);
        break;
      case 'history.refresh':
        refreshHistory(resolve);
        break;
      case 'history.refresh-if-need':
        refreshHistoryIfNeed();
        resolve();
        break;
      default: break;
    }
  });
}

function deleteClipping(msg, resolve) {
  const handler = ClippingHandler_NativeApp;
  handler.deleteClipping(msg, (result) => {
    if(result.ok){ generateClippingJsIfNeed() }
    resolve(result);
  })
}

function refreshHistory(resolve) {
  const handler = ClippingHandler_NativeApp;
  handler.refreshHistory({
    time: T.currentTime().toString()
  }, (result) => {
    if(result.ok){
      resetStates('clips', result.clips);
      resetStates('tags', result.tags);
      resetStates('categories', result.categories);
      const time = T.currentTime().toString();
      MxWcStorage.set('lastRefreshHistoryTime', time);
      generateClippingJsIfNeed()
    }
    resolve(result);
  })
}

function exportHistory(content) {
  const arr = [content];
  const blob = new Blob(arr, {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const s = T.currentTime().str;
  const t = [s.year, s.month, s.day, s.hour, s.minute, s.second].join('');
  ExtApi.download({
    saveAs: false,
    filename: ['mx-wc-history', t, 'json'].join('.'),
    url: url
  })
}

/*
 * handler.saveClipping(tabId, clipping)
 * saveTasks
 */

function saveClipping(tabId, clipping) {
  getClippingHandler((handler) => {

    const feedback = function(msg) {
      switch(msg.type) {
        case 'started':
          clippingSaveStarted(tabId, msg);
          break;
        case 'progress':
          clippingSaveProgress(tabId, msg);
          break;
        case 'completed':
          const result = msg.clippingResult;
          // compatible with old message
          result.handler = handler.name;
          clippingSaveCompleted(tabId, result);
          break;
        default: break;
      }
    }

    handler.saveClipping(clipping, feedback);
  });
}

function clippingSaveStarted(tabId, msg) {
  Log.debug('started');
  ExtApi.sendMessageToContent({
    type: 'clipping.save.started',
    detail: {
      clipId: msg.clipId
    }
  }, tabId);
}

function clippingSaveProgress(tabId, msg) {
  const progress = [msg.finished, msg.total].join('/');
  Log.debug('progress', progress);
  ExtApi.sendMessageToContent({
    type: 'clipping.save.progress',
    detail: {
      clipId: msg.clipId,
      finished: msg.finished,
      total: msg.total
    }
  }, tabId);
}

function clippingSaveCompleted(tabId, clippingResult){
  Log.debug('completed');
  Log.debug(clippingResult);
  ExtApi.sendMessageToContent({
    type: 'clipping.save.completed',
    detail: clippingResult
  }, tabId);
  MxWcStorage.set('lastClippingResult', clippingResult);
  MxWcIcon.flicker(3);
  generateClippingJsIfNeed();
}


function generateClippingJsIfNeed(){
  MxWcConfig.load().then((config) => {
    if(config.autogenerateClippingJs){
      generateClippingJs();
    }
  })
}

function generateClippingJs(callback) {
  getClippingHandler((handler, config) => {
    let pathConfig = MxWcConfig.getDefault().clippingJsPath;
    if(config.clippingJsPath.indexOf('$MX-WC/') === 0 && config.clippingJsPath.endsWith('js')){
      pathConfig = config.clippingJsPath;
    }
    const filename = pathConfig.replace('$MX-WC', 'mx-wc');
    MxWcStorage.get('clips', [])
      .then((clippings) => {
        const json = JSON.stringify(clippings);
        const task = {
          text: `;var clippings = ${json};`,
          mimeType: 'text/javascript',
          filename: filename
        }
        handler.saveTextFile(task);
        const time = T.currentTime().toString();
        MxWcStorage.set('lastGenerateClippingJsTime', time);
        if(callback) {callback({time: time})};
      });
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
    callback(handler, config);
  })
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

// Native App Config may changed, update it
function updateNativeAppConfig(){
  getClippingHandler((handler) => {
    if(handler.name === 'native-app') {
      Log.debug('updateNativeAppConfig');
      handler.initDownloadFold();
    }
  });
}

function checkNativeAppVersion(){
  getClippingHandler((handler) => {
    if(handler.name === 'native-app') {
      const currentKey = 'check-native-app-version-' + ENV.version;
      MxWcStorage.get(currentKey, false)
        .then((isChecked) => {
          if(isChecked) {
            Log.debug(currentKey, 'checked');
          } else {
            handler.getVersion((result) => {
              const link =  MxWcLink.get('extPage.notification');
              if(result.ok) {
                if(!T.isVersionGteq(result.version, ENV.minNativeAppVersion)) {
                  const message = t('notification.native-app-version-too-small').replace('$requiredVersion', ENV.minNativeAppVersion).replace('$currentVersion', result.version);
                  Log.error(message);
                  MxWcNotification.add('danger', message, function(){
                    ExtApi.createTab(link);
                  })
                }
              } else {
                const message = t('notification.native-app-connect-failed').replace('$errorMessage', result.message);
                Log.error(message);
                MxWcNotification.add('danger', message, function(){
                  ExtApi.createTab(link);
                })
              }
              MxWcStorage.set(currentKey, true);
            })
          }
        });
    }
  })
}

function refreshHistoryIfNeed(){
  MxWcConfig.load().then((config) => {
    if(config.autoRefreshHistory){
      if(config.clippingHandlerName === 'native-app') {
        refreshHistory((result) => {
          if(!result.ok) {
            Log.error("AutoRefreshHistory: ");
            Log.error(result.message)
          }
        });
      } else {
        Log.debug("autoRefreshHistory enabled, but clipping handler is NOT native-app, do nothing");
      }
    }
  });
}

// state
let keyStoreService = null;
function init(){
  WebRequest.listen();
  keyStoreService = createKeyStoreService();
  ExtApi.addMessageListener(messageHandler);
  Log.debug("background init...");
  welcomeNewUser();
  updateNativeAppConfig();
  checkNativeAppVersion();
  refreshHistoryIfNeed();
}

init();
