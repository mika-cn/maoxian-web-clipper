;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcStoreClient', ['MxWcTool'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(require('../lib/tool.js'));
  } else {
    // browser or other
    root.MxWcStoreClient = factory(root.MxWcTool);
  }
})(this, function(T, undefined) {
  "use strict";

  //TODO delete this file.
  //
  const StoreClient = {
    getHeaders: function() {
      // we can restrict referer for more security.
      return {
        "Referer": window.location.href,
        "Origin": window.location.origin,
        "User-Agent": window.navigator.userAgent
      }
    },
    assetInfos2Tasks: function(clipId, assetFolder, assetInfos) {
      return T.map(assetInfos, (assetInfo) => {
        return StoreClient.assetInfo2Task(clipId, assetFolder, assetInfo);
      });
    },
    assetInfo2Task: function(clipId, assetFolder, assetInfo) {
      const filename = T.joinPath([assetFolder, assetInfo.assetName]);
      return {
        taskType: [assetInfo.type, 'Task'].join(''),
        type: 'url',
        filename: filename,
        url: assetInfo.link,
        headers: StoreClient.getHeaders(),
        clipId: clipId,
        createdMs: T.currentTime().str.intMs
      }
    }
  }

  return StoreClient;
});
