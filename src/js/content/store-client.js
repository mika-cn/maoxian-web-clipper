// store-client.js
const KeyStore = {
  start: function() {
    return ExtApi.sendMessageToBackground({type: 'keyStore.start'});
  },
  reset: function() {
    return ExtApi.sendMessageToBackground({type: 'keyStore.reset'});
  },
  add: function(key) {
    return ExtApi.sendMessageToBackground({type: 'keyStore.add', body: {key: key}});
  }
}

const TaskStore = {
  start: function(){
    return ExtApi.sendMessageToBackground({type: 'taskStore.start'})
  },
  reset: function(){
    return ExtApi.sendMessageToBackground({type: 'taskStore.reset'})
  },
  add: function(task) {
    return ExtApi.sendMessageToBackground({type: 'taskStore.add', body: task});
  },
  getResult: function(callback){
    ExtApi.sendMessageToBackground({type: 'taskStore.getResult'}).then(callback)
  }
}

const StoreClient = {
  addImages: function(assetFold, assetInfos) {
    this.addAssets(assetFold, assetInfos);
  },
  addFonts: function(assetFold, assetInfos) {
    this.addAssets(assetFold, assetInfos);
  },
  addAssets: function(assetFold, assetInfos){
    T.each(assetInfos, function(it){
      // same link, download once.
      KeyStore.add(it.link).then((canAdd) => {
        if(canAdd) {
          TaskStore.add({
            type: 'url',
            url: it.link,
            filename: T.joinPath([assetFold, it.assetName])
          })
        }
      }).catch((err) => {
        console.error(err);
        console.trace();
      });
    });
  }
}
