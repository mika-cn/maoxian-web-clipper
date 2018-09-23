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
  addImages: function(clipId, assetFold, assetInfos) {
    this.addAssets(clipId, assetFold, assetInfos);
  },
  addFonts: function(clipId, assetFold, assetInfos) {
    this.addAssets(clipId, assetFold, assetInfos);
  },
  addAssets: function(clipId, assetFold, assetInfos){
    T.each(assetInfos, function(it){
      // same link, download once.
      KeyStore.add(it.link).then((canAdd) => {
        if(canAdd) {
          TaskStore.save({
            clipId: clipId,
            type: 'url',
            url: it.link,
            filename: T.joinPath([assetFold, it.assetName]),
            headers: {
              "Referer": window.location.href,
              "User-Agent": window.navigator.userAgent
            }
          })
        }
      }).catch((err) => {
        console.error(err);
        console.trace();
      });
    });
  }
}
