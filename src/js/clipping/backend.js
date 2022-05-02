
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
      case 'add.nameConflictResolver':
        addNameConflictResolver(message.body);
        resolve();
        break;
      case 'get.uniqueFilename':
        const filename = getUniqueFilename(message.body);
        if (filename) {
          resolve(filename);
        } else {
          reject(new Error("couldn't find nameConflictResolver"));
        }
        break;
      case 'get.allFrames':
        getAllFrames(sender.tab.id).then(resolve, reject);
        break;
      case 'get.mimeType':
        getMimeType(message.body).then(resolve, reject);
        break;
      case 'fetch.text':
        ActionCache.findOrCache(
          [message.body.sessionId, message.body.url].join('.'),
          () => {
          return Global.Fetcher.get(message.body.url, {
            respType: 'text',
            headers: message.body.headers,
            timeout: message.body.timeout,
            tries: message.body.tries,
          });
        }).then(resolve, reject);
        break;
      case 'frame.clipAsHtml.takeSnapshot':
      case 'frame.clipAsMd.takeSnapshot':
        const frameId = message.body.frameId;
        if (frameId) {
          // redirect message to content frame.
          ExtMsg.sendToContentFrame(message, sender.tab.id, frameId
          ).then(resolve, reject);
        } else {
          reject(new Error("NoFrameID"));
        }
        break;
      case 'clipped':
        const clipping = message.body;
        removeNameConflictResolver(clipping.info.clipId);
        const sessionId = clipping.info.clipId;
        ActionCache.removeByKeyPrefix(sessionId);
        resolve();
        break;
      default:
        reject(new Error(`clipping/backend.js: Unknown message: ${message.type}`));
        break;
    }
  });
}

//

function addNameConflictResolver({clipId, nameConflictResolverObject}) {
  const resolver = T.restoreFilenameConflictResolver(nameConflictResolverObject);
  Global.nameConflictResolverDict.add(clipId, resolver);
}

function getUniqueFilename({clipId, id, folder, filename}) {
  const resolver = Global.nameConflictResolverDict.find(clipId);
  if (resolver) {
    return resolver.resolveFile(id, folder, filename);
  } else {
    return null;
  }
}

function removeNameConflictResolver(clipId) {
  Global.nameConflictResolverDict.remove(clipId);
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

  return frames.sort((a, b) => a.frameId - b.frameId);
}


/*
 * @param {Object} global
 *   - {Fetcher} Fetcher
 *   - {Module} WebRequest
 */
let Global = null;
export default function init(global) {
  Global = global;
  Global.nameConflictResolverDict = T.createDict();
  ExtMsg.listen('backend.clipping', messageHandler);
}
