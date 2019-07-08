
const ClippingHandler_WizNotePlus = (function(){
    const state = {
      isConnected: false,
    };
    
    /**
     * Saving a new clip.
     * @param {*} clipping The tasks of clipping.
     * @param {*} feedback 
     */
    async function saveClipping(clipping, feedback) {
        //TODO: deal with the failure of initialization. Use try catch
        await init();
        SavingTool.startSaving(clipping, feedback, {mode: 'completeWhenAllTaskFinished'});
        // Save all tasks.
        await createDocTempDir(clipping);
        let promises = clipping.tasks.map((task) => handle(task, clipping));
        let results = await Promise.all(promises);
        // Create a new document in WizNotePlus.
        saveToWizNotePlus(clipping, feedback);
    }

    async function saveToWizNotePlus(clipping, feedback) {
      const info = clipping.info;
      // Process document location
      let sLocation = info.category;
      sLocation = sLocation.startsWith('/') ? sLocation : '/' + sLocation;
      sLocation = sLocation.endsWith('/') ? sLocation : sLocation + '/';
      sLocation = sLocation == '/default/' ? '' : sLocation; /* Empty location means default location in WizNotePlus. */
      // Process document tags
      let aTags = info.tags;
      // Save to WizNote
      await state.objApp.DatabaseManager.CreateDocument(
        [state.tempPath, info.clipId, "index.html"].join('/'),
        info.title, sLocation, aTags, info.link
      );
    }

    /**
     * Initialize the whole clipping handler.
     */
    async function init(){
        if(!state.isConnected){
          if (!(state.isConnected = !!(await createWebChannel()))) {
            const err = new Error("Failed to connect WizNotePlus!")
            alert(err);
            Log.error(err)
            throw err;
          }
        }
      }

    /**
     * Build web channel to WizNotePlus.
     */
    async function createWebChannel() {
        return new Promise( (resolve, reject) => {
            const baseUrl = "ws://localhost:8848";
            Log.info("Connecting to WebSocket server at " + baseUrl + ".");
          
            let socket = new WebSocket(baseUrl);
          
            socket.onclose = function() {
              Log.error("web channel closed");
              state.isConnected = false;
            };
          
            socket.onerror = function(error) {
              Log.error("web channel error: " + error);
              state.isConnected = false;
              reject(error);
            };
          
            socket.onopen = function() {
              Log.debug("WebSocket connected, setting up QWebChannel.");
              new QWebChannel(socket, async function(channel) {
                Log.debug("Web channel opened");
                state.isConnected = true;
                state.objApp = channel.objects["WizExplorerApp"];
                state.objCom = state.objApp.CommonUI;
                state.tempPath = [await state.objCom.GetSpecialFolder('TemporaryFolder'), 'webclipping'].join('/');
                window["WizExplorerApp"] = channel.objects["WizExplorerApp"]; // Only used for APIs test.
                resolve(true);
              });
            }
        })

    }

    /**
     * Used to handle tasks.
     * @param {Object} task
     * @param {Object} clipping
     */
    async function handle(task, clipping) {
        if (task.filename.split('/').includes('index_files'))
            task.isAssets = true;
        switch(task.type){
            case 'text': await downloadTextToFile(task, clipping); break;
            case 'url' : await downloadUrlToFile(task, clipping); break;
        }
    }

    /**
     * Save text to file.
     * @param {*} task
     */
    async function downloadTextToFile(task, clipping) {
      const objCom = state.objCom;
      const docPath = [
        state.tempPath, 
        task.isAssets ? task.clipId + '/index_files' : task.clipId
      ].join('/');
      const isDownloaded = await objCom.SaveTextToFile(
        [docPath, task.filename.split('/').pop()].join('/'), task.text, 'utf-8');
      downloadCompleted(task, isDownloaded, clipping);
      return isDownloaded;
    }
    
    /**
     * Download asset to file.
     * @param {*} task 
     */
    async function downloadUrlToFile(task, clipping){
      const objCom = state.objCom;
      const docPath = [
        state.tempPath, 
        task.isAssets ? task.clipId + '/index_files' : task.clipId
      ].join('/');
      const isImage = ['gif', 'png', 'jpg', 'ico'].includes(task.filename.split('.').pop());
      const isDownloaded = await objCom.URLDownloadToFile(
        task.url, [docPath, task.filename.split('/').pop()].join('/'), isImage);
      downloadCompleted(task, isDownloaded, clipping);
      return isDownloaded;
    }
    
    /**
     * Notify download state.
     * @param {Object} task
     * @param {boolean} isDownloaded
     * @param {Object} clipping
     */
    function downloadCompleted(task, isDownloaded, clipping) {
        if (isDownloaded) {
            SavingTool.taskCompleted(getTaskFilename(task.filename));
        } else {
            SavingTool.taskFailed(getTaskFilename(task.filename), "Failed to download.");
        }
    }

    /**
     * Create a temprary folder which used to organize clip files.
     */
    async function createDocTempDir(clipping) {
      const objCom = state.objCom;
      const docPath = [state.tempPath, clipping.info.clipId, 'index_files'].join('/');
      if (!(await objCom.CreateDirectory(docPath)))
        Log.error("Faild to create directory at " + docPath);
      return docPath;
    }
    
    /**
     * Used to identify the entry file.
     * @param {*} filename 
     */
    function isMainFile(filename) {
      return (
           filename.endsWith('.html') && !filename.endsWith('.frame.html')
        || filename.endsWith('.md')
        || filename.endsWith('.mxwc'));
    }

    /**
     * Used to identify the index.json file.
     * @param {string} filename 
     */
    function isMetaFile(filename) {
      return filename.endsWith('index.json');
    }

    function isTitleFile(filename) {
      return filename.split('/').pop().startsWith('a-title__');
    }

    function getIdFromFilename(filename) {
      const path = filename.split('mx-wc')[1];
      return md5(path);
    }

    function getTaskFilename(fullFilename) {
      const path = fullFilename.split('mx-wc')[1];
      return ['mx-wc', path].join('');
    }
  
    return {
      name: 'WizNotePlus',
      saveClipping: saveClipping
    }
  
  
  })();  