
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
    let jsons = []
    const length = files.length;
    const msRegExp = /-(\d{9,})\//;
    for(let i=0; i < length; i++){
      const file = files[i];
      if(file.type === "application/json"){
        const path = file.webkitRelativePath;
        if(path.match(msRegExp)){
          const t = parseInt(path.match(msRegExp)[1]);
          jsons.push({t: t, file: file});
        }else{
          console.warn("MxWc.ErrorPathFormat", path);
        }
      }
    }
    jsons = jsons.sort(function(a, b){ return b.t - a.t });
    return parseJsons(jsons);
  }

  function parseJsons(jsons){
    const clips = [];
    const categories = [];
    const tags = [];
    jsons.forEach(function(it){
      const clip = readJson(it.file);
      clip.id = it.t.toString();
      if(!clip.format){ clip.format = 'html'; }
      clips.push(clip);
      clip.tags.forEach(function(tag){
        if(tags.indexOf(tag) == -1){
          tags.push(tag)
        }
      });
      const path = clip.path.replace('mx-wc/', '');
      const parts = path.split('/');
      const category = parts.slice(0, parts.length - 2).join('/');
      if(categories.indexOf(category) == -1){
        categories.push(category);
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
