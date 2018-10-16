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
    const headers = { "Referer": window.location.href, "User-Agent": window.navigator.userAgent };
    const filename = T.joinPath([assetFold, assetInfo.assetName]);
    if(fetchAssetFirst) {
      fetch(assetInfo.link).then((resp) => {
        resp.blob().then((blob) => {
          if(MxWcLink.isFirefox()) {
            // Firefox can pass blob through background.
            // But can not access ObjectUrl that create in content script.
            TaskStore.save({
              type: 'blob',
              clipId: clipId,
              blob: blob,
              filename: filename,
              headers: headers
            });
          } else {
            // chrome can't pass blob throuth background
            // But can access ObjectUrl that create in content script.
            TaskStore.save({
              type: 'url',
              clipId: clipId,
              url: URL.createObjectURL(blob),
              filename: filename,
              headers: headers
            });
          }
        })
      })

    } else {
      TaskStore.save({
        type: 'url',
        clipId: clipId,
        url: assetInfo.link,
        filename: filename,
        headers: headers
      });
    }
  }
}
