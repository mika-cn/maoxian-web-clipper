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
    this.resolvLink(assetInfo, fetchAssetFirst).then((link) => {
      TaskStore.save({
        clipId: clipId,
        type: 'url',
        url: link,
        filename: T.joinPath([assetFold, assetInfo.assetName]),
        headers: {
          "Referer": window.location.href,
          "User-Agent": window.navigator.userAgent
        }
      })
    })
  },
  resolvLink: function(assetInfo, fetchAssetFirst){
    if(fetchAssetFirst) {
      return new Promise(function(resolve, reject){
        Log.debug('FetchAsset', assetInfo.link);
        fetch(assetInfo.link).then((resp) => {
          resp.blob().then((blob) => {
            resolve(URL.createObjectURL(blob));
          })
        })
      });
    } else {
      return new Promise(function(resolve, reject){
        resolve(assetInfo.link);
      });
    }
  }
}
