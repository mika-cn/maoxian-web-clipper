import T      from '../js/lib/tool.js';
import ExtMsg from '../js/lib/ext-msg.js';


// NOTE:
// In order to auto close off-screen document,
// We should always call revoke-object-url.

const dict = {}; // objectUrl => isRevoked

function listenMessage() {
  ExtMsg.listen('off-screen', function(msg) {
    return new Promise((resolve, reject) => {
      switch(msg.type) {
        case 'create-object-url':
          const {base64Str, mimeType} = msg.body;
          const blob = T.base64StrToBlob(base64Str, mimeType);
          const url = URL.createObjectURL(blob);
          dict[url] = false;
          resolve(url);
          break;
        case 'revoke-object-url':
          const {blobUrl} = msg.body;
          URL.revokeObjectURL(blobUrl);
          dict[blobUrl] = true;
          resolve();
          tryAutoCloseMyself();
          break;
        default:
          reject(new Error(`off-screen.js, Unknown message: ${msg.type}`));
          break;
      }
    });
  });
}


function tryAutoCloseMyself() {
  if (isAllUrlsRevoked()) {
    closeMyselfWithDelay();
  }
}


let closing;
function closeMyselfWithDelay() {
  if (!closing) {
    const delay = 30 * 1000; // 30 seconds
    closing = T.createDelayCall(closeMyself, delay)
  }
  closing.run();
}


function closeMyself() {
  if (isAllUrlsRevoked()) {
    ExtMsg.sendToBackground({type: 'close.off-screen'});
  }
}

function isAllUrlsRevoked() {
  for (const url in dict) {
    // if url is not revoked
    if (!dict[url]) { return false }
  }
  return true;
}


function main() {
  listenMessage();
  console.debug("Off-screen have iniaialized");
}

main();
