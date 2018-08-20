const LocalDisk = {}

LocalDisk.saveImageFiles = (fold, assetInfos) => {
  LocalDisk.downloadAssets(fold, assetInfos);
}
LocalDisk.saveFontFiles = (fold, assetInfos) => {
  LocalDisk.downloadAssets(fold, assetInfos);
}


LocalDisk.saveIndexFile = (fold, info) => {
  const json = T.toJson(info);
  const filename = `${fold}/index.json`;
  LocalDisk.saveTextFile(json, 'application/json', filename);
}

LocalDisk.saveTitleFile = (fold, info) => {
  const filename = `${fold}/a-title__${T.sanitizeFilename(info.title)}`;
  LocalDisk.saveTextFile('-', 'text/plain', filename);
}

LocalDisk.saveTextFile = (text, mimeType, filename) => {
  ExtApi.sendMessageToBackground({
    type: 'download.text',
    body: {
      text: text,
      mimeType: mimeType,
      filename: filename
    }
  });
}

LocalDisk.downloadAssets = (fold, assetInfos) => {
  T.each(assetInfos, function(it){
    // same link, download once.
    ExtApi.sendMessageToBackground({
      type: 'keyStore.add',
      body: {key: it.link}
    }).then((canAdd) => {
      if(canAdd) {
        ExtApi.sendMessageToBackground({
          type: 'download.url',
          body:{
            url: it.link,
            filename: `${fold}/${it.assetName}`
          }
        });
      }
    });
  });
}
