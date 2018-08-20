


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
      case 'download.url':
        storeTabId(sender, message);
        downloadUrl(message.body);
        resolve();
        break;
      case 'download.text':
        storeTabId(sender, message);
        downloadText(message.body);
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

function getIdFromPath(path){
  if(T.includeFold(path, 'mx-wc')){
    return T.sanitizePath(path).split('mx-wc')[1];
  }else{
    return T.sanitizePath(path);
  }
}

function storeTabId(sender, message){
  if(sender.tab){
    tabIdDict.add(getIdFromPath(message.body.filename), sender.tab.id);
  }
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

// msg: {:url, :filename}
function downloadUrl(msg){
  download(msg.filename, msg.url);
}

// msg: {:text, :mineType, :filename}
function downloadText(msg){
  const arr = [msg.text];
  const opt = {type: msg.mimeType};
  const blob = new Blob(arr, opt);
  const url = URL.createObjectURL(blob);
  download(msg.filename, url);
}


function download(filename, url){
  filename = "mx-wc" + filename;
  Log.debug("download.url: ", url);
  Log.debug("download.filename: ", filename);
  ExtApi.download({
    saveAs: false,
    filename: filename,
    url: url
  }).then((downloadItemId) => {
    // download started successfully
    // console.log("started: ", downloadItemId, filename);
  }, (rejectMsg) => {
    Log.error(rejectMsg);
  } ).catch((err) => {
    Log.error(err);
  });
}


function downloadCompleted(downloadItemId){
  const filename = filenameDict.find(downloadItemId);
  const id = getIdFromPath(filename);
  const tabId = tabIdDict.find(id);
  // file that not download through maoxian web clipper
  if(T.excludeFold(filename, 'mx-wc')){ return false }
  if(  filename.endsWith('.html') && !filename.endsWith('.frame.html')
    || filename.endsWith('.md')
    || filename.endsWith('.mxwc')){
    if(filename.endsWith('.mxwc')){
      ExtApi.deleteDownloadItem(downloadItemId);
    }else{
      ExtApi.sendMessageToContent({ type: 'download.completed'}, tabId);
      MxWcStorage.set('lastDownloadItemId', downloadItemId);
      MxWcIcon.flicker(3);
    }
  }else{
    // erase assets download history
    browser.downloads.erase({id: downloadItemId, limit: 1});
  }
  filenameDict.remove(downloadItemId);
  tabIdDict.remove(id);
}

function filenameCreated(downloadItemId, filename){
  // file that not download through maoxian web clipper
  if(T.excludeFold(filename, 'mx-wc')){ return false }
  filenameDict.add(downloadItemId, filename);
  updateDownloadFold(filename);
}

function updateDownloadFold(filename){
  if(  filename.endsWith('.html') && !filename.endsWith('.frame.html')
    || filename.endsWith('.md')
    || filename.endsWith('.mxwc')){
    // Update download Fold, Cause user might change download fold.
    // Update as soon as possible.
    const downloadFold = filename.split('mx-wc')[0];
    MxWcStorage.set('downloadFold', downloadFold);
  }
}

function downloadCreated(e){
  if(e.filename){
    // firefox have filename on downloadCreated
    filenameCreated(e.id, T.sanitizePath(e.filename))
  }
}

//https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/downloads/onChanged#downloadDelta
function downloadChanged(e){
  if(e.filename && e.filename.current){
    // chrome have firename on downloadChanged
    filenameCreated(e.id, T.sanitizePath(e.filename.current));
  }
  if(e.state && e.state.current === 'complete'){
    downloadCompleted(e.id);
  }
}


function initDownloadFold(){
  MxWcStorage.get('downloadFold')
    .then((root) => {
      if(!root){
        downloadText({
          mimeType: 'text/plain',
          text: "useless file, delete me :)",
          filename: '/touch.mxwc'
        });
      }
    });
}


function createKeyStoreService(){
  const service = createLockService(50);

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

// state
let filenameDict = null; // downloadItemId = > filename
let tabIdDict    = null; // filenameId = > tabId
let keyStoreService = null;
function init(){
  WebRequest.listen();
  filenameDict = T.createDict();
  tabIdDict = T.createDict();
  keyStoreService = createKeyStoreService();
  ExtApi.bindDownloadCreatedListener(downloadCreated);
  ExtApi.bindDownloadChangedListener(downloadChanged);
  ExtApi.addMessageListener(messageHandler);
  Log.debug("background init...");
}

init();
