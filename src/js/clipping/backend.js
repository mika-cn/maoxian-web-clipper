
import T           from '../lib/tool.js';
import ExtApi      from '../lib/ext-api.js';
import ExtMsg      from '../lib/ext-msg.js';
import ActionCache from '../lib/action-cache.js';


function messageHandler(message, sender) {
  return new Promise(function(resolve, reject){
    switch(message.type){
      case 'broadcast-event.internal':
      case 'broadcast-event.public':
        getCurrentLayerFrames(sender.tab.id, message.body.frameId).then((frames) => {
          frames.forEach((frame) => {
            const body = Object.assign({}, message.body, {frameId: frame.frameId});
            const msg = {type: message.type, body: body}
            ExtMsg.sendToContentFrame(msg, sender.tab.id, frame.frameId);
          });
          resolve();
        });
        break;
      case 'get.allFrames':
        getAllFrames(sender.tab.id).then(resolve);
        break;
      case 'get.mimeType':
        getMimeType(message.body).then(resolve, reject);
        break;
      case 'fetch.text':
        ActionCache.findOrCache(
          [message.body.clipId, message.body.url].join('.'),
          () => {
          return Global.Fetcher.get(message.body.url, {
            respType: 'text',
            headers: message.body.headers,
            timeout: message.body.timeout,
            tries: message.body.tries,
          });
        }).then(resolve, reject);
        break;
      case 'frame.toHtml':
      case 'frame.toMd':
        ActionCache.findOrCache(
          [message.body.clipId, message.frameUrl].join('.'),
          () => {
          // Redirect message to content frame.
          return ExtMsg.sendToContentFrame(message, sender.tab.id, message.frameId);
        }).then(resolve, reject);
        break;
      case 'clipped':
        const clipping = message.body;
        ActionCache.removeByKeyPrefix(clipping.info.clipId);
        resolve();
        break;
    }
  });
}

async function getMimeType({url, headers, timeout, tries}) {
  let mimeType = Global.WebRequest.getMimeType(url);
  if (mimeType) {
    return mimeType;
  } else {
    try {
      //get mimeType by sending a HEAD request
      const respHeaders = await Global.Fetcher.head(url, {headers, timeout, tries});
      const contentType = respHeaders.get('Content-Type');
      if (contentType) {
        return T.parseContentType(contentType).mimeType;
      } else {
        return '__EMPTY__';
      }
    } catch(e) {
      console.error(e);
      return '__EMPTY__';
    }
  }
}

async function getCurrentLayerFrames(tabId, parentFrameId) {
  const frames = await ExtApi.getAllFrames(tabId);
  const result = [];
  frames.forEach((it) => {
    if (it.parentFrameId === parentFrameId && it.url && !T.isBrowserExtensionUrl(it.url)) {
      result.push(it);
    }
  });
  return result;
}

async function getAllFrames(tabId) {
  // get frame redirections
  const dict = Global.WebRequest.getRedirectionDict('sub_frame');
  const redirectFrom = {};
  for (let url in dict) {
    const targetUrl = dict[url];
    redirectFrom[targetUrl] = url;
  }
  const frames = await ExtApi.getAllFrames(tabId);
  frames.forEach((it) => {
    it.originalUrl = (redirectFrom[it.url] || it.url);
  });
  return frames;
}

/*
 * @param {Object} global
 *   - {Fetcher} Fetcher
 *   - {Module} WebRequest
 */
let Global = null;
export default function init(global) {
  Global = global;
  ExtMsg.listen('backend.clipping', messageHandler);
}
