// store-client.js
const KeyStore = {
  init: function() {
    return ExtApi.sendMessageToBackground({type: 'keyStore.init'});
  },
  add: function(key) {
    return ExtApi.sendMessageToBackground({type: 'keyStore.add', body: {key: key}});
  }
}

const TaskStore = {
  save: function(task) {
    return ExtApi.sendMessageToBackground({type: 'save.task', body: task});
  }
}

const StoreClient = {
  getHeaders: function() {
    // we can restrict referer for more securie.
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
  addImages: function(clipId, assetFold, assetInfos, fetchAssetFirst) {
    this.addAssets(clipId, assetFold, assetInfos, fetchAssetFirst);
  },
  addFonts: function(clipId, assetFold, assetInfos, fetchAssetFirst) {
    this.addAssets(clipId, assetFold, assetInfos, fetchAssetFirst);
  },
  addAssets: function(clipId, assetFold, assetInfos, fetchAssetFirst){
    T.each(assetInfos, function(it){
      // same link, download once.
      KeyStore.add(it.link).then((canAdd) => {
        if(canAdd) {
          StoreClient.addAsset(clipId, assetFold, it, fetchAssetFirst);
        }
      }).catch((err) => {
        console.error(err);
        console.trace();
      });
    });
  },
  addAsset: function(clipId, assetFold, assetInfo, fetchAssetFirst) {
    const headers = { "Referer": window.location.href, "User-Agent": window.navigator.userAgent };
    const filename = T.joinPath([assetFold, assetInfo.assetName]);
    //FIXME fetchAssetFirst is not use anymore.
    TaskStore.save({
      type: 'url',
      clipId: clipId,
      url: assetInfo.link,
      filename: filename,
      headers: StoreClient.getHeaders()
    });
  }
}
