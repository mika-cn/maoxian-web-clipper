// store-client.js
const KeyStore = {
  init: function() {
    return ExtApi.sendMessageToBackground({type: 'keyStore.init'});
  },
  add: function(key) {
    return ExtApi.sendMessageToBackground({type: 'keyStore.add', body: {key: key}});
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
    return new Promise(function(resolve, _){
      ExtApi.sendMessageToBackground({
        type: 'fetch.text',
        body: {
          url: url,
          headers: StoreClient.getHeaders()
        }
      }).then(resolve)
    })
  },
  assetInfos2Tasks: function(clipId, assetFold, assetInfos) {
    return T.map(assetInfos, (assetInfo) => {
      return StoreClient.assetInfo2Task(clipId, assetFold, assetInfo);
    });
  },
  assetInfo2Task: function(clipId, assetFold, assetInfo) {
    const filename = T.joinPath([assetFold, assetInfo.assetName]);
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
