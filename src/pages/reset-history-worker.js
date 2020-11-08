
"use strict";

onmessage = function(e){
  postMessage({type: 'resetProcessing' , body: null});
  const r = parseFiles(e.data.files, e.data.rootFolder);
  postMessage({type: 'reset.clips'      , body: r.clips});
  postMessage({type: 'reset.tags'       , body: r.tags});
  postMessage({type: 'reset.categories' , body: r.categories});
  postMessage({type: 'resetCompleted'   , body: null});
}

function parseFiles(files, rootFolder){
  let items = []
  const length = files.length;
  const msRegExp = /-(\d{9,})\//;
  for(let i=0; i < length; i++){
    const file = files[i];
    if(file.type === "application/json"){
      const clip = readJson(file);

      if (clip) {
        const {version = '1.0'} = clip;

        if (version === '1.0') {

          // old index.json file compatible( not id attr => id => clipId )
          if(!clip.clipId) {
            if(clip.id) {
              clip.clipId = clip.id;
            } else {
              const path = file.webkitRelativePath;
              if(path.match(msRegExp)){
                clip.clipId = path.match(msRegExp)[1];
              } else {
                clip.clipId = '00' + Math.round(Math.random() * 10000000);
              }
            }
          }

          // handle category
          const storePath = toStorePath(clip.path, rootFolder);
          const parts = storePath.split('/');
          // FIXME Not safe: path relative.
          clip.category = parts.slice(0, parts.length - 2).join('/');

          if(!clip.format) {
            clip.format = 'html';
          }
        }

        delete clip['paths'];
        items.push({t: parseInt(clip.clipId), clip: clip});
      }

    }
  }
  items = items.sort(function(a, b){ return b.t - a.t });
  return parseClips(items);
}

function toStorePath(path, rootFolder) {
  const sep = `${rootFolder}/`;
  const arr = path.split(sep)
  arr.shift();
  return arr.join(sep)
}

function parseClips(items){
  const clips = [];
  const categories = [];
  const tags = [];
  items.forEach(function(it){
    clips.push(it.clip);
    it.clip.tags.forEach(function(tag){
      if(tags.indexOf(tag) == -1){
        tags.push(tag)
      }
    });
    if(categories.indexOf(it.clip.category) == -1){
      categories.push(it.clip.category);
    }
  });
  return { clips: clips, categories: categories, tags: tags }
}

function readJson(file){
  const reader = new FileReaderSync();
  const text =  reader.readAsText(file);
  const json = JSON.parse(text);
  if(isClippingInfoFile(json)) {
    // fix windows path
    json.path = file.webkitRelativePath.replace(/\\/g, '/');
    return json;
  } else {
    return null;
  }
}

function isClippingInfoFile(json) {
  if (json.version && json.version === '2.0') {
    return json.title && json.link && json.mainPath && json.paths;
  } else {
    return json.title && json.created_at && json.link;
  }
}
