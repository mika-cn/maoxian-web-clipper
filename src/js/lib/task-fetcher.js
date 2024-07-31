
import T       from './tool.js';
import Storage from './storage.js';

// see lib/fetcher-using-xhr.js
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
      console.debug(task.url, mimeType);
      return T.base64StrToBlob(base64Data, mimeType);
    } else {
      throw new Error(`Target blob url not exist in storage: ${task.url}`);
    }

  } else {
    const blob = await Global.Fetcher.get(task.url, {
      respType: 'blob',
      headers: task.headers,
      timeout: task.timeout,
      tries: task.tries,
    });
    return blob;
  }
}

let Global;

function init(it) {
  Global = it;
}

export default {init, get};
