import T      from '../js/lib/tool.js';
import ExtMsg from '../js/lib/ext-msg.js';

function listenMessage() {
  ExtMsg.listen('off-screen', function(msg) {
    return new Promise((resolve, reject) => {
      switch(msg.type) {
        case 'create-object-url':
          const {base64Str, mimeType} = msg.body;
          const blob = T.base64StrToBlob(base64Str, mimeType);
          const url = URL.createObjectURL(blob);
          resolve(url);
          break;
        case 'revoke-object-url':
          const {blobUrl} = msg.body;
          URL.revokeObjectURL(blobUrl);
          resolve();
          break;
        default:
          reject(new Error(`off-screen.js, Unknown message: ${msg.type}`));
          break;
      }
    });
  });
}

function main() {
  console.debug("Off-screen main");
  listenMessage();
  console.debug("Off-screen iniaialized");
}

main();
