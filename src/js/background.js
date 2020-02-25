
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    factory(
      require('./env.js'),
      require('./lib/log.js'),
      require('./lib/tool.js'),
      require('./lib/ext-api.js'),
      require('./lib/ext-msg.js'),
      require('./lib/storage.js'),
      require('./lib/config.js'),
      require('./lib/link.js'),
      require('./lib/icon.js'),
      require('./assistant/plan-repository.js'),
      require('./selection/backend.js'),
      require('./background/fetcher.js'),
      require('./background/migration.js'),
      require('./background/web-request.js'),
      require('./background/cache-service.js'),
      require('./background/clipping-handler-native-app.js'),
      require('./background/handler-background.js')
    );
  } else {
    // browser or other
    factory(
      root.MxWcEnv,
      root.MxWcLog,
      root.MxWcTool,
      root.MxWcExtApi,
      root.MxWcExtMsg,
      root.MxWcStorage,
      root.MxWcConfig,
      root.MxWcLink,
      root.MxWcIcon,
      root.MxWcPlanRepository,
      root.MxWcSelectionBackend,
      root.MxWcFetcher,
      root.MxWcMigration,
      root.MxWcWebRequest,
      root.MxWcCacheService,
      root.MxWcClippingHandler_NativeApp,
      root.MxWcHandlerBackground
    );
  }
})(this, function( ENV, Log, T, ExtApi, ExtMsg,
    MxWcStorage, MxWcConfig, MxWcLink, MxWcIcon, PlanRepository, SelectionBackend, Fetcher, MxWcMigration,
    WebRequest, CacheService, ClippingHandler_NativeApp, MxWcHandlerBackground, undefined) {

  "use strict";

  const asyncFunQueue = T.createAsyncFnQueue();


  function messageHandler(message, sender){
    return new Promise(function(resolve, reject){
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
        case 'query.selection':
          SelectionBackend.query(message.body).then(resolve);
          break;
        case 'save.selection':
          SelectionBackend.save(message.body).then(resolve);
          break;
        case 'get.mimeTypeDict' : resolve(WebRequest.getMimeTypeDict())   ; break;
        case 'init.downloadFolder': initDownloadFolder()                  ; resolve() ; break ;
        case 'save.category'    : saveCategory(message.body)              ; resolve() ; break ;
        case 'save.tags'        : saveTags(message.body)                  ; resolve() ; break ;
        case 'save.clippingHistory' : saveClippingHistory(message.body)   ; resolve() ; break ;

        case 'reset.clips'      : resetStates('clips', message.body)      ; resolve() ; break ;
        case 'reset.categories' : resetStates('categories', message.body) ; resolve() ; break ;
        case 'reset.tags'       : resetStates('tags', message.body)       ; resolve() ; break ;
        case 'fetch.text':
          CacheService.findOrCache(
            [message.body.clipId, message.body.url].join('.'),
            () => {
            return Fetcher.get(message.body.url, {
              respType: 'text',
              headers: message.body.headers,
              timeout: message.body.timeout,
            });
          }).then(resolve, reject);
          break;
        case 'get.allFrames':
          ExtApi.getAllFrames(sender.tab.id)
            .then(resolve);
          break;
        case 'frame.toHtml':
        case 'frame.toMd':
          CacheService.findOrCache(
            [message.body.clipId, message.frameUrl].join('.'),
            () => {
            // Redirect message to content frame.
            return ExtMsg.sendToContentFrame(message, sender.tab.id, message.frameId);
          }).then(resolve);
          break;
        case 'export.history':
          exportHistory(message.body.content);
          resolve();
          break;
        case 'clipping.save':
          CacheService.removeByKeyPrefix(message.body.info.clipId);
          saveClipping(sender.tab.id, message.body);
          resolve();
          break;
        case 'clipping.delete':
          deleteClipping(message.body, resolve);
          break;
        case 'generate.clipping.js':
          generateClippingJs(resolve);
          break;
        case 'generate.clipping.js.if-need':
          generateClippingJsIfNeed();
          resolve();
          break;
        case 'history.refresh':
          refreshHistory(resolve);
          break;
        case 'handler.get-info':
          getHandlerInfo(message.body, resolve);
          break;
        case 'create-tab':
          ExtApi.createTab(message.body.link).then(resolve);
          break;
        default:
          throw new Error("Unknown message" + message.type);
          break;
      }
    });
  }

  function getHandlerInfo(msg, resolve) {
    const handler = MxWcHandlerBackground.get(msg.name);
    handler.getInfo(resolve);
  }

  function deleteClipping(msg, resolve) {
    const handler = ClippingHandler_NativeApp;
    handler.deleteClipping(msg, (result) => {
      if(result.ok){ generateClippingJsIfNeed() }
      resolve(result);
    })
  }

  function refreshHistory(resolve) {
    MxWcHandlerBackground.isReady('config.refreshHistoryHandler').then((r) => {
      const {ok, message, handler, config} = r;
      if(ok) {
        handler.refreshHistory({
          root_folder: config.rootFolder,
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
      } else {
        resolve({ ok: false, message: message});
      }
    });
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
            clippingSaveCompleted(tabId, msg.clippingResult, handler);
            break;
          default: break;
        }
      }

      handler.saveClipping(clipping, feedback);
    });
  }

  function clippingSaveStarted(tabId, msg) {
    Log.debug('started');
    ExtMsg.sendToContent({
      type: 'clipping.save.started',
      body: {
        clipId: msg.clipId
      }
    }, tabId);
  }

  function clippingSaveProgress(tabId, msg) {
    const progress = [msg.finished, msg.total].join('/');
    Log.debug('progress', progress);
    ExtMsg.sendToContent({
      type: 'clipping.save.progress',
      body: {
        clipId: msg.clipId,
        finished: msg.finished,
        total: msg.total
      }
    }, tabId);
  }

  function clippingSaveCompleted(tabId, result, handler){
    Log.debug('completed');
    // compatible with old message
    result.handler = handler.name;
    result = handler.handleClippingResult(result);
    Log.debug(result);
    updateClippingHistory(result);
    ExtMsg.sendToContent({
      type: 'clipping.save.completed',
      body: result
    }, tabId);
    MxWcStorage.set('lastClippingResult', result);
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
    MxWcHandlerBackground.isReady('config.offlinePageHandler').then((result) => {
      const {ok, message, handler, config} = result;
      if(ok) {
        let pathConfig = MxWcConfig.getDefault().clippingJsPath;
        if(config.clippingJsPath.indexOf('$STORAGE-PATH/') === 0 && config.clippingJsPath.endsWith('js')){
          pathConfig = config.clippingJsPath;
        }
        const filename = pathConfig.replace('$STORAGE-PATH', config.rootFolder);
        MxWcStorage.get('clips', []).then((clippings) => {
          clippings.forEach((it) => {
            // minimize size
            delete it['paths'];
          });
          const json = JSON.stringify(clippings);
          const task = {
            text: `;var clippings = ${json};`,
            mimeType: 'text/javascript',
            filename: filename
          }
          handler.saveTextFile(task);
          const time = T.currentTime().toString();
          MxWcStorage.set('lastGenerateClippingJsTime', time);
          if(callback) {callback({ok: true, time: time})};
        });
      } else {
        if(callback) {
          callback({ok: false, message: message });
        }
      }
    });
  }

  function getClippingHandler(callback) {
    MxWcConfig.load().then((config) => {
      callback(MxWcHandlerBackground.get(config.clippingHandler), config);
    })
  }

  function initDownloadFolder(){
    MxWcStorage.get('downloadFolder').then((root) => {
      if(!root){
        getClippingHandler((handler, config) => {
          handler.initDownloadFolder(config);
        });
      }
    });
  }

  function resetStates(key, states){
    MxWcStorage.set(key, states);
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

  function saveClippingHistory(msg){
    const it = msg.clippingHistory;
    MxWcStorage.get('clips', [])
      .then((v) => {
        v.unshift(it);
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

  function welcomeNewUser(){
    MxWcStorage.get('firstRunning', true)
      .then((firstRunning) => {
        if(firstRunning){
          MxWcStorage.set('firstRunning', false)
          ExtApi.createTab(MxWcLink.get('extPage.welcome'));
        }
      })
  }


  function refreshHistoryIfNeed(){
    MxWcConfig.load().then((config) => {
      if(config.autoRefreshHistory){
        refreshHistory((result) => {
          if(!result.ok) {
            Log.error("AutoRefreshHistory: ");
            Log.error(result.message)
          } else {
            Log.debug("History refreshed");
          }
        });
      }
    });
  }

  function init(){
    Log.debug("background init...");
    MxWcMigration.perform();
    MxWcHandlerBackground.initialize();
    ExtMsg.initPage('background');
    ExtMsg.listen(messageHandler);
    WebRequest.listen();
    refreshHistoryIfNeed();
    welcomeNewUser();
    PlanRepository.init();
    Log.debug("background init finish...");
  }

  init();
});
