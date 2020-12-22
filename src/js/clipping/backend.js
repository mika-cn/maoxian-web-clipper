
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
      case 'get.mimeTypeDict':
        resolve(Global.WebRequest.getMimeTypeDict());
        break;
      case 'get.allFrames':
        getAllFrames(sender.tab.id).then(resolve);
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

async function getCurrentLayerFrames(tabId, parentFrameId) {
  const frames = await ExtApi.getAllFrames(tabId);
  const result = [];
  frames.forEach((it) => {
    if (it.parentFrameId === parentFrameId) {
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
