
import ExtApi      from '../lib/ext-api.js';
import ExtMsg      from '../lib/ext-msg.js';
import ActionCache from '../lib/action-cache.js';


function messageHandler(message, sender) {
  return new Promise(function(resolve, reject){
    switch(message.type){
      case 'get.mimeTypeDict':
        resolve(Global.WebRequest.getMimeTypeDict());
        break;
      case 'get.allFrames':
        ExtApi.getAllFrames(sender.tab.id).then(resolve);
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
        }).then(resolve);
        break;
      case 'clipped':
        const clipping = message.body;
        ActionCache.removeByKeyPrefix(clipping.info.clipId);
        break;
    }
  });
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
