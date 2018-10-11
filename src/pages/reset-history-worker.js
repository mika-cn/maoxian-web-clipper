
"use strict";

(function(workerScope){
  workerScope.onmessage = function(e){
    postMessage({type: 'resetProcessing' , body: null});
    const r = parseFiles(e.data);
    postMessage({type: 'reset.clips'      , body: r.clips});
    postMessage({type: 'reset.tags'       , body: r.tags});
    postMessage({type: 'reset.categories' , body: r.categories});
    postMessage({type: 'resetCompleted'   , body: null});
  }

  function parseFiles(files){
    let items = []
    const length = files.length;
    const msRegExp = /-(\d{9,})\//;
    for(let i=0; i < length; i++){
      const file = files[i];
      if(file.type === "application/json"){
        const clip = readJson(file);

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
        const path = clip.path.replace('mx-wc/', '');
        const parts = path.split('/');
        // FIXME Not safe: path relative.
        clip.category = parts.slice(0, parts.length - 2).join('/');

        if(!clip.format) {
          clip.format = 'html';
        }

        items.push({t: parseInt(clip.clipId), clip: clip});
      }
    }
    items = items.sort(function(a, b){ return b.t - a.t });
    return parseClips(items);
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
    // fix win path
    json.path = file.webkitRelativePath.replace(/\\/g, '/');
    return json;
  }
})(this);
