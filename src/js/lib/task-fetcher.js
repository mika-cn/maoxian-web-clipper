
import T       from './tool.js';
import Storage from './storage.js';

// Note that: All blob url tasks should saved into storage first.
async function get(task) {
  if (task.type !== 'url') {
    throw new Error('Not a url task');
  }

  if (T.isBlobUrl(task.url)) {
    // fetch blob url data from storage
    const key = [task.clipId, task.url].join('.');
    const blobUrlObj = await Storage.local.get(key);
    if (blobUrlObj) {
      const {mimeType, base64Data} = blobUrlObj;
      return T.base64StrToBlob(base64Data, mimeType);
    } else {
      throw new Error(`Target blob url not exist in storage: ${task.url}`);
    }

  } else {
    const fetchingUrl = Global.Fetcher.get(task.url, {
      respType: 'blob',
      headers: task.headers,
      timeout: task.timeout,
      tries: task.tries,
    });
    return waitUntil(fetchingUrl);
  }
}


// Keep a service worker alive until a long-running operation is finished
// An official API similar to waitUntil() is currently being discussed in the WECG.
// For more detail, see https://github.com/w3c/webextensions/issues/416
async function waitUntil(longRunningPromise) = {
  const keepAlive = setInterval(chrome.runtime.getPlatformInfo, 25 * 1000);
  try {
    return await longRunningPromise;
  } finally {
    clearInterval(keepAlive);
  }
}


let Global;

// it.fetcher  @see lib/fetcher.js
function init(it) {
  Global = it;
}

export default {init, get};
