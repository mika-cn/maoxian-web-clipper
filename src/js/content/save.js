
"use strict";

this.MxWcSave = (function (MxWcConfig, ExtApi) {

  // inputs => {:title, :category, :tagstr, :elem}
  function save(inputs) {
    let {title, category, tagstr, elem} = inputs;
    MxWcConfig.load().then((config) => {
      if(title.trim() === ""){
        title = 'default';
      }

      const tags = T.splitTagstr(tagstr);
      saveInputHistory('tags', tags);
      const appendTags = []
      if (config.saveDomainAsTag) {
        appendTags.push(window.location.host);
      }

      // deal entry filename
      let name = 'index';
      if (config.saveTitleAsFilename) {
        name = T.sanitizeFilename(title);
      }
      const filename = name + '.' + config.saveFormat;

      // deal Fold
      const now = T.currentTime();
      const clipId = now.str.intSec;
      const ROOT = 'mx-wc';
      let fold = null;
      let foldName = getClippingFolderName(config, title, now);
      category = category.trim();
      if(category === ""){
        if(config.defaultCategory === "$NONE"){
          fold = T.joinPath([ROOT, foldName])
        } else {
          category = (config.defaultCategory === '' ? 'default' : config.defaultCategory);
          fold = T.joinPath([ROOT, category, foldName]);
        }
      } else {
        if(category === '$NONE'){
          category = '';
          fold = T.joinPath([ROOT, foldName])
        } else {
          saveInputHistory('category', category);
          fold = T.joinPath([ROOT, category, foldName]);
        }
      }

      // asset fold
      let assetFold = null;
      let assetRelativePath = null;
      if(config.assetPath.indexOf('$CLIP-FOLD') > -1){
        assetRelativePath = config.assetPath.replace('$CLIP-FOLD/', '');
        assetFold = T.joinPath([fold, assetRelativePath]);
      } else {
        if(config.assetPath.indexOf('$MX-WC') > -1){
          assetFold = T.joinPath([ROOT, config.assetPath.replace('$MX-WC/', '')]);
          assetRelativePath = T.calcPath(fold, assetFold)
        } else {
          assetRelativePath = (config.assetPath === '' ? 'assets' : config.assetPath);
          assetFold = T.joinPath([fold, assetRelativePath]);
        }
      }

      const path =  { clipFold: fold, assetFold: assetFold, assetRelativePath: assetRelativePath};
      Log.debug(path)

      const info = {
        clipId     : clipId,
        format     : config.saveFormat,
        title      : title,
        link       : window.location.href,
        category   : category,
        tags       : tags.concat(appendTags),
        created_at : now.toString(),
        filename   : filename
      }

      let parser = null;
      switch(config.saveFormat){
        case 'html' : parser = MxWcHtml; break;
        case 'md'   : parser = MxWcMarkdown; break;
      }
/*
 * Task:
 * saving task of resource (html, css, font, img, md...)
 *
 * structure:
 * {
 *   taskType : 'htmlFileTask', 'imageFileTask' etc.
 *   taskId   : task id (reconsider this)
 *   type     : resource content type, 'url' or 'text'
 *   filename : filename to save
 *   url      : resource's url (if type is 'url')
 *   mimeType : resource's mimeType (if type is 'text')
 *   text     : resource's content (if type is 'text')
 *   headers  : http headers (Referer, UserAgent etc. if type is 'url')
 *   clipId   : clipping id
 *   createdMs: created time (millisecond)
 * }
 */

      const params = { path: path, elem: elem, info: info, config: config }
      parser.parse(params).then((tasks) => {
        if(!(config.saveTitleAsFoldName || config.saveTitleAsFilename)) {
          tasks.unshift(getTitleFileTask(path, info));
        }
        tasks.unshift(getIndexFileTask(path, info));
        const uniqTasks = rmReduplicateTask(tasks);
        const clipping = {info: info, tasks: uniqTasks};
        console.log(clipping);
      })
      // FIXME : move to clipping handler
      //saveClipHistory(path.clipFold, info);
    });
  }

  function rmReduplicateTask(tasks) {
    const result = [];
    const names = [];
    T.each(tasks, (task) => {
      if(names.indexOf(task.filename) === -1) {
        result.push(task);
        names.push(task.filename);
      } else {
        Log.debug('reduplicate task:', task);
      }
    });
    return result;
  }

  function getClippingFolderName(config, title, now) {
    const defaultName = generateDefaultClippingFolderName(config, now)
    let name = defaultName;
    if (config.saveTitleAsFoldName) {
      switch(config.titleClippingFolderFormat){
        case '$FORMAT-B':
          name = T.sanitizeFilename(title);
          break;
        default:
          // $FORMAT-A or other
          name = [defaultName, T.sanitizeFilename(title)].join('-');
      }
    }
    return name;
  }

  function generateDefaultClippingFolderName(config, now) {
    const s = now.str;
    let name = '';
    switch(config.defaultClippingFolderFormat) {
      case '$FORMAT-B':
        name = [
          s.year,
          s.month,
          s.day,
          s.hour,
          s.minute,
          s.second
        ].join('')
        break;
      case '$FORMAT-C':
        name = s.intSec;
        break;
      default:
        // $FORMAT-A or other
        name = [
          s.year,
          s.month,
          s.day,
          s.intSec
        ].join('-');
    }
    return name;
  }

  // private
  function getTitleFileTask(path, info){
    return {
      taskType: 'titleFileTask',
      type: 'text',
      filename: [path.clipFold,
        `a-title__${T.sanitizeFilename(info.title)}`
      ].join('/'),
      mimeType: 'text/plain',
      text: '-',
      clipId: info.clipId,
      createdMs: T.currentTime().str.intMs
    }
  }

  // private
  function getIndexFileTask(path, info){
    return {
      taskType: 'InfoFileTask',
      type: 'text',
      filename: [path.clipFold, 'index.json'].join('/'),
      mimeType: 'application/json',
      text: T.toJson(info),
      clipId: info.clipId,
      createdMs: T.currentTime().str.intMs
    }
  }

  //private
  function saveInputHistory(k, v){
    const body = {}
    body[k] = v;
    ExtApi.sendMessageToBackground({
      type: `save.${k}`,
      body: body
    });
  }

  // FIXME : remove me to clipping handler
  //private
  function saveClipHistory(clipFold, info){
    const path = [clipFold, 'index.json'].join('/');
    const clip = Object.assign({path: path}, info);
    ExtApi.sendMessageToBackground({
      type: 'save.clip',
      body: {clip: clip}
    })
  }


  return {
    save: save
  }

})(MxWcConfig, ExtApi);
