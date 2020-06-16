
import ExtApi from '../lib/ext-api.js';
import ExtMsg from '../lib/ext-msg.js';
import ActionCache from '../lib/action-cache.js';
import Fetcher from '../background/fetcher.js';


function messageHandler(message, sender) {
  return new Promise(function(resolve, reject){
    switch(message.type){
      case 'get.mimeTypeDict' : resolve(Global.WebRequest.getMimeTypeDict())   ; break;
      case 'get.allFrames':
        ExtApi.getAllFrames(sender.tab.id)
          .then(resolve);
        break;
      case 'fetch.text':
        ActionCache.findOrCache(
          [message.body.clipId, message.body.url].join('.'),
          () => {
          return Fetcher.get(message.body.url, {
            respType: 'text',
            headers: message.body.headers,
            timeout: message.body.timeout,
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
        //FIXME
        // page clipped, remove cache
        ActionCache.removeByKeyPrefix(message.body.info.clipId);
        break;
    }
  });
}

let Global = null;
/*
 * @param {Object} global
 *   - {Module} WebRequest
 */
export default function init(global) {
  Global = global;
  ExtMsg.listen('background', messageHandler);
}
