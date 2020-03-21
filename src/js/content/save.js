  "use strict";

  import T from '../lib/tool.js';
  import Log from '../lib/log.js';
  import ExtMsg from '../lib/ext-msg.js';
  import Task from '../lib/task.js';
  import InputParser from './input-parser.js';
  import MxWcHtml from './save-as-html.js';
  import MxWcMarkdown from './save-as-markdown.js';

  // inputs => {:format, :title, :category, :tagstr, :elem}
  function save(inputs, config) {
    let {format = config.saveFormat, title, category, tagstr, elem} = inputs;

    const inputParams = {
      format: format,
      title: title.trim(),
      category: category.trim(),
      tags: T.splitTagstr(tagstr),
      domain: window.location.host.split(':')[0],
      link: window.location.href,
      config: config
    }
    const {info, storageInfo, input,
      needSaveIndexFile, needSaveTitleFile
    } = InputParser.parse(inputParams);

    // versions: none, 2.0
    info.version = '2.0'

    if(input.category != '') {
      saveInputHistory('category', input.category);
    }
    if(input.tags.length > 0) {
      saveInputHistory('tags', input.tags);
    }

    Log.debug(storageInfo)

    let parser = null;
    switch(info.format){
      case 'html' : parser = MxWcHtml; break;
      case 'md'   : parser = MxWcMarkdown; break;
    }

    const params = { storageInfo: storageInfo, elem: elem, info: info, config: config }
    parser.parse(params).then((tasks) => {

      if(needSaveTitleFile) {
        const filename = T.joinPath(storageInfo.titleFileFolder, storageInfo.titleFileName);
        tasks.unshift(Task.createTitleTask(filename, info.clipId));
      }
      const _tasks = Task.rmReduplicate(tasks);

      // info.paths is used to delete files.
      info.paths = [];
      if (needSaveIndexFile) {

        // calculate path
        info.paths.push(storageInfo.infoFileName);
        const {mainPath, paths} = Task.getRelativePath(
          _tasks, storageInfo.infoFileFolder);
        info.mainPath = mainPath;
        info.paths.push(...paths);

        const filename = T.joinPath(storageInfo.infoFileFolder, storageInfo.infoFileName);
        _tasks.unshift(Task.createInfoTask(filename, info))
      } else {
        const mainFileTask = _tasks.find(it => it.taskType === 'mainFileTask')
        if (mainFileTask) {
          // We assume infoFileFolder is same as mainFileFolder.
          const infoFileFolder = storageInfo.mainFileFolder;
          info.mainPath = T.calcPath(infoFileFolder, mainFileTask.filename);
        } else {
          throw Error("Can not find mainFileTask");
        }
      }

      const clipping = {
        info: info,
        tasks: Task.sort(_tasks)
      };

      Log.debug(clipping);

      // save clipping
      ExtMsg.sendToBackground({
        type: 'clipping.save',
        body: clipping
      });

      if (needSaveIndexFile)
        saveClippingHistory(info, storageInfo);
    })

  }

  //private
  function saveInputHistory(k, v){
    const body = {}
    body[k] = v;
    ExtMsg.sendToBackground({
      type: `save.${k}`,
      body: body
    });
  }

  //private
  function saveClippingHistory(info, storageInfo){
    const path = T.joinPath(storageInfo.infoFileFolder, storageInfo.infoFileName);
    const clippingHistory = Object.assign({path: path}, info);
    ExtMsg.sendToBackground({
      type: 'save.clippingHistory',
      body: {clippingHistory: clippingHistory}
    })
  }


  const Save = {
    save: save
  }

  export default Save;