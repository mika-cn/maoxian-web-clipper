const ClippingHandler_Browser = (function(){
  const state = {
    isListening: false,
    filenameDict: T.createDict() // downloadItemId => filename
  };

  function saveClipping(clipping, feedback) {
    init();
    SavingTool.startSaving(clipping, feedback, {mode: 'completeWhenAllTaskFinished'});
    T.each(clipping.tasks, (task) => {
      saveTask(task);
    });
  }

  function getTaskFilename(fullFilename) {
    const path = fullFilename.split('mx-wc')[1];
    return ['mx-wc', path].join('');
  }

  // msg: {:text, :mineType, :filename}
  function downloadText(msg){
    const arr = [msg.text];
    const opt = {type: msg.mimeType};
    const blob = new Blob(arr, opt);
    const url = URL.createObjectURL(blob);
    downloadUrl({url: url, filename: msg.filename});
  }

  function downloadBlob(msg){
    const url = URL.createObjectURL(msg.blob);
    downloadUrl({url: url, filename: msg.filename});
  }

  function downloadUrl(msg){
    Log.debug('download.url:', msg.url);
    Log.debug('download.filename:', msg.filename);
    /*
     * Referer and User-Agent are restricted by browser( as unsafe headers) :(
     */
    ExtApi.download({
      conflictAction: 'overwrite',
      saveAs: false,
      filename: msg.filename,
      url: msg.url
    }).then((downloadItemId) => {
      // download started successfully
      // console.log("started: ", downloadItemId, filename);
    }, (rejectMsg) => {
      Log.error(rejectMsg);
    } ).catch((err) => {
      Log.error(err);
    });
  }

  function isMainFile(filename) {
    return (
         filename.endsWith('.html') && !filename.endsWith('.frame.html')
      || filename.endsWith('.md')
      || filename.endsWith('.mxwc'));
  }

  function downloadCompleted(downloadItemId){
    const filename = state.filenameDict.find(downloadItemId);
    state.filenameDict.remove(downloadItemId);
    // file that not download through maoxian web clipper
    if(T.excludeFold(filename, 'mx-wc')){ return false }
    if(filename.endsWith('.mxwc')) {
      // touch file
      ExtApi.deleteDownloadItem(downloadItemId);
    } else {
      const taskFilename = getTaskFilename(filename);
      SavingTool.taskCompleted(taskFilename, {
        fullFilename: filename,
        downloadItemId: downloadItemId
      });
      if(!isMainFile(filename)) {
        // erase assets download history
        browser.downloads.erase({id: downloadItemId, limit: 1});
      }
    }
  }

  function filenameCreated(downloadItemId, filename){
    // file that not download through maoxian web clipper
    if(T.excludeFold(filename, 'mx-wc')){ return false }
    state.filenameDict.add(downloadItemId, filename);
    updateDownloadFold(filename);
  }

  function updateDownloadFold(filename){
    if(isMainFile(filename)){
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

    if(e.state && e.state.current === 'in_progress') {
      // The browser is currently receiving download data from the server.
    }

    if(e.state && e.state.current === 'interrupted') {
      // An error broke the connection with the server.
      // Never reach here :)
      // see fetchAndDownload function.
    }

    if(e.state && e.state.current === 'complete'){
      // The download completed successfully.
      downloadCompleted(e.id);
    }
  }

  function initDownloadFold(){
    init();
    downloadText({
      mimeType: 'text/plain',
      text: "useless file, delete me :)",
      filename: 'mx-wc/touch.mxwc'
    });
  }

  function saveTextFile(task) {
    init();
    task.type = 'text';
    saveTask(task);
  }

  function saveTask(task) {
    switch(task.type){
      // html, markdown, styles
      case 'text': downloadText(task); break;
      case 'blob': downloadBlob(task); break;
      // images and fonts
      case 'url' : fetchAndDownload(task); break;
    }
  }

  function fetchAndDownload(task) {
    Log.debug('fetch', task.url);
    Fetcher.get('blob', task.url, task.headers)
      .then(
        (blob) => {
          downloadBlob({
            blob: blob,
            filename: task.filename
          })
        },
        (errMsg) => {
          SavingTool.taskFailed(task.filename, errMsg);
        }
      );
  }

  function init(){
    if(!state.isListening){
      ExtApi.bindDownloadCreatedListener(downloadCreated);
      ExtApi.bindDownloadChangedListener(downloadChanged);
      state.isListening = true;
    }
  }

  function getInfo(callback) {
    callback({
      ready: true,
      supportFormats: ['html', 'md']
    });
  }


  return {
    name: 'browser',
    getInfo: getInfo,
    saveClipping: saveClipping,
    saveTextFile: saveTextFile,
    initDownloadFold: initDownloadFold
  }


})();
