"use strict";

import Log             from '../lib/log.js';
import MxWcStorage     from '../lib/storage.js';
import SavingTool      from '../saving/saving-tool.js';
import { QWebChannel } from '../lib/qwebchannel.js';

const state = {
  /** Used to identify webchannel state. */
  isConnected: false,
  /** The entry object of WizNotePlus APIs. */
  objApp: null,
  /** Useful tools of WizNotePlus APIs. */
  objCom: null,
  /** Temporary path used by WizNotePlus. */
  tempPath: null,
};

/**
 * Saving a new clip.
 * @param {*} clipping The tasks of clipping.
 * @param {*} feedback
 */
async function saveClipping(clipping, feedback) {
  await setup();
  SavingTool.startSaving(clipping, feedback, { mode: 'completeWhenAllTaskFinished' });
  // Save all tasks.
  await createDocTempDir(clipping);
  let promises = clipping.tasks.map((task) => handle(task, clipping));
  let results = await Promise.all(promises);
  // Create a new document in WizNotePlus.
  saveToWizNotePlus(clipping, feedback);
}

async function saveToWizNotePlus(clipping, feedback) {
  const info = clipping.info;
  const indexFileName = [state.tempPath, info.clipId, "index.html"].join('/');
  // Embed markdown into index.html
  if (info.format === 'md') {
    info.title = info.title + ".md";
    const markdownText = getMarkdownText(clipping.tasks);
    const html = embedMarkdownIntoHtml(markdownText, info.title, info.link);
    await state.objCom.SaveTextToFile(indexFileName, html, 'utf-8');
  }
  // Process document location
  let sLocation = info.category;
  sLocation = sLocation.startsWith('/') ? sLocation : '/' + sLocation;
  sLocation = sLocation.endsWith('/') ? sLocation : sLocation + '/';
  sLocation = sLocation == '/default/' ? '' : sLocation; /* Empty location means default location in WizNotePlus. */
  // Process document tags
  let aTags = info.tags;
  // Save to WizNote
  await state.objApp.DatabaseManager.CreateDocument(
    indexFileName, info.title, sLocation, aTags, info.link);
  // Give feedback: get document GUID and then generate wiz:// link
  // mode == completeWhenAllTaskFinished will calculate numbers of
  // completed task, then determine the prograss of saving.
  //TODO: Create clipId - docGUID dict
}

function getMarkdownText(tasks) {
  // Get markdown text
  let markdownText = "";
  for (const task of tasks) {
    if (task.taskType == "mainFileTask"
      && task.mimeType == "text/markdown") {
      markdownText = task.text;
    }
  }
  // Process markdown text
  markdownText = markdownText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>")
    .replace(/\t/g, "&nbsp;".repeat(4)) //TODO: make it configurable
    .replace(/ /g, "&nbsp;");
  return markdownText;
}

function embedMarkdownIntoHtml(markdownText, title, link) {
  return `
<!DOCTYPE html>
<html>
    <!-- OriginalSrc: ${link} -->
    <head>
        <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
    </head>
    <body>
        ${markdownText}
    </body>
</html>`;
}

/**
 * Return the state and information of clipping-handler
 */
async function getInfo(callback) {
  try {
    await setup();
    //TODO: send database username
    callback({
      ready: true,
      supportFormats: ['html', 'md']
    });
  } catch (err) {
    callback({
      ready: false,
      message: err.message,
      supportFormats: ['html', 'md']
    })
  }
}

/**
 * Initialize the whole clipping handler.
 */
async function setup() {
  // Connect to WizNotePlus
  if (!state.isConnected) {
    state.isConnected = !!(await createWebChannel());
  }
  // Sync categories and tags to Browser local storage.
  syncCategories();
  syncTags();
}

/**
 * Build web channel to WizNotePlus.
 */
async function createWebChannel() {
  return new Promise((resolve, reject) => {
    const baseUrl = "ws://localhost:8848";
    Log.info("Connecting to WebSocket server of WizNotePlus at " + baseUrl + ".");

    let socket = new WebSocket(baseUrl);

    socket.onclose = function () {
      Log.error("web channel closed");
      state.isConnected = false;
    };

    socket.onerror = function (error) {
      Log.error("web channel error: " + error);
      state.isConnected = false;
      error.message = "Web channel error, failed to connect to WizNotPlus."
      reject(error);
    };

    socket.onopen = function () {
      Log.debug("WebSocket connected, setting up QWebChannel.");
      new QWebChannel(socket, async function (channel) {
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

async function syncCategories() {
  // Get old and new categories
  const objDb = state.objApp.Database;
  let aLocations = await objDb.GetAllLocations();
  let aCategories = await MxWcStorage.get('categories', []);
  // Remove unavailable categories
  aCategories = aCategories.filter(value => aLocations.includes(value));
  // Unite two unique array
  aLocations = aLocations.filter(value => !aCategories.includes(value));
  aCategories = [...aCategories, ...aLocations];
  // Save to Browser local storage
  MxWcStorage.set('categories', aCategories);
}

async function syncTags() {
  // Get old and new categories
  const objDb = state.objApp.Database;
  let aTags = await objDb.GetAllTags();
  let aStoredTags = await MxWcStorage.get('tags', []);
  // Remove unavailable tags
  aStoredTags = aStoredTags.filter(value => aTags.includes(value));
  // Unite two tags array
  aTags = aTags.filter(value => !aStoredTags.includes(value));
  aStoredTags = [...aStoredTags, ...aTags];
  // Save to local storage
  MxWcStorage.set('tags', aStoredTags);
}

/**
 *
 */
function handleClippingResult(it) {
  //TODO: Create clipId - docGUID dict
  it.url = 'file://' + it.filename;
  return it;
}

/**
 * Used to handle tasks.
 * @param {Object} task
 * @param {Object} clipping
 */
async function handle(task, clipping) {
  if (typeof state.objCom.Base64ToFile !== "undefined") {
    Log.debug("Use browser network.");
    switch (task.type) {
      case 'text': await downloadTextToFile(task, clipping); break;
      case 'url' : await fetchAndDownload(task, clipping); break;
      case 'blob': await downloadBlobToFile(task, clipping); break;
    }
  } else {
    Log.debug("Use WizNotePlus network.");
    switch(task.type){
      case 'text': await downloadTextToFile(task, clipping); break;
      case 'url': await downloadUrlToFile(task, clipping); break;
    }
  }
}

/**
 * Save text to file.
 * @param {*} task
 */
async function downloadTextToFile(task, clipping) {
  const objCom = state.objCom;
  const filename = [state.tempPath, task.filename].join('/');
  const isDownloaded = await objCom.SaveTextToFile(filename, task.text, 'utf-8');
  downloadCompleted(task, isDownloaded, clipping);
  return isDownloaded;
}

/**
 * Download asset to file.
 * @param {*} task
 */
async function downloadUrlToFile(task, clipping) {
  const objCom = state.objCom;
  const filename = [state.tempPath, task.filename].join('/');
  const isImage = ['gif', 'png', 'apng', 'jpg', 'svg', 'bmp', 'webp', 'ico'].includes(task.filename.split('.').pop());
  const isDownloaded = await objCom.URLDownloadToFile(task.url, filename, isImage);
  downloadCompleted(task, isDownloaded, clipping);
  return isDownloaded;
}

/**
 * Save blob to file
 */
async function downloadBlobToFile(task, clipping){
  const objCom = state.objCom;
  const blob = task.blob;
  const filename = [state.tempPath, task.filename].join('/');
  const blobBase64 = await blobToBase64(blob);
  const isDownloaded = await objCom.Base64ToFile(blobBase64, filename);
  downloadCompleted(task, isDownloaded, clipping);
  return isDownloaded;
}

async function blobToBase64(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = function () {
      resolve(reader.result.replace(/^data:.+;base64,/, ''));
    }
    reader.readAsDataURL(blob);
  });
}

async function fetchAndDownload(task, clipping) {
  Log.debug('fetch', task.url);
  try {
    const blob = await Global.Fetcher.get(task.url, {
      respType: 'blob',
      headers: task.headers,
      timeout: task.timeout,
      tries: task.tries,
    });
    await downloadBlobToFile({
      blob: blob,
      filename: task.filename
    }, clipping);
  } catch (err) {
    Log.error(err);
    SavingTool.taskFailed(task.filename, err.message);
  }
}


/**
 * Notify download state.
 * @param {Object} task
 * @param {boolean} isDownloaded
 * @param {Object} clipping
 */
function downloadCompleted(task, isDownloaded, clipping) {
  if (isDownloaded) {
    //FIXME: add extra attrs to MainFile.
    SavingTool.taskCompleted(task.filename);
  } else {
    SavingTool.taskFailed(task.filename, "Failed to download.");
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

let Global = null;
function init(global) {
  Global = global;
}

const ClippingHandler_WizNotePlus = {
  name: 'WizNotePlus',
  init: init,
  getInfo: getInfo,
  saveClipping: saveClipping,
  handleClippingResult: handleClippingResult
}

export default ClippingHandler_WizNotePlus;
