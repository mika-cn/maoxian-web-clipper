// store-client.js
const KeyStore = {
  init: function() {
    return ExtMsg.sendToBackground({type: 'keyStore.init'});
  },
  add: function(key) {
    return ExtMsg.sendToBackground({type: 'keyStore.add', body: {key: key}});
  }
}

const StoreClient = {
  getHeaders: function() {
    // we can restrict referer for more security.
    return {
      "Referer": window.location.href,
      "Origin": window.location.origin,
      "User-Agent": window.navigator.userAgent
    }
  },
  fetchText: function(url) {
    return new Promise(function(resolve, reject){
      ExtMsg.sendToBackground({
        type: 'fetch.text',
        body: {
          url: url,
          headers: StoreClient.getHeaders()
        }
      }).then(resolve, reject)
    })
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
