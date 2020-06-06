"use strict";

import T from '../lib/tool.js';
import Log from '../lib/log.js';
import ExtMsg from '../lib/ext-msg.js';
import Task from '../lib/task.js';

import StorageConfig_Default from './storage-config-default.js';
import StorageConfig_WizNotePlus from './storage-config-wiznoteplus.js';
import StorageConfigRender from './storage-config-render.js';

import MxHtmlClipper from './clip-as-html.js';
import MxMarkdownClipper from './clip-as-markdown.js';

/**
 *
 * @param {Object} formInputs: {:format, :title, :category, :tagstr}
 *
 * @return {Object}
 *   - {Object} userInput {:format, :title, :category, :tags}
 *   - {Object} info  - meta information
 *   - {Object} storageInfo
 *   - {Object} storageConfig
 *
 */
function getReadyToClip(formInputs, config, {domain, pageUrl}) {

  const userInput = dealFormInputs(formInputs);
  const now = Date.now();

  const appendTags = [];
  if (config.saveDomainAsTag) {
    appendTags.push(domain);
  }

  let storageConfig = {};
  switch(config.clippingHandler) {
    case 'WizNotePlus':
      storageConfig = StorageConfig_WizNotePlus.get({
        now: now, config: config
      });
    default:
      // Browser or NativeApp
      storageConfig = StorageConfig_Default.get({
        config: config
      })
  }

  const storageInfo = StorageConfigRender.exec(Object.assign(
    { storageConfig, now, domain },
    T.sliceObj(userInput, ['format', 'title', 'category']))
  );
  Log.debug(storageInfo)

  // TODO consider me.
  userInput.category = storageInfo.category;

  // metas
  const tObj = T.wrapNow(now);
  const info = {
    version    : '2.0', /* none, 2.0 */
    clipId     : tObj.str.intSec,
    format     : userInput.format,
    title      : userInput.title,
    link       : pageUrl,
    category   : userInput.category,
    tags       : userInput.tags.concat(appendTags),
    created_at : tObj.toString(),
  }

  return {userInput, info, storageInfo, storageConfig};
}


/*
 * @return a Promise that will resolve with clipping
 */
async function clip(elem, {info, storageInfo, config, storageConfig}) {
  let Clipper = null;
  switch(info.format){
    case 'html' : Clipper = MxHtmlClipper; break;
    case 'md'   : Clipper = MxMarkdownClipper; break;
  }

  let tasks = await Clipper.clip(elem, {info, storageInfo, config});

  if (storageConfig.saveTitleFile) {
    const filename = T.joinPath(storageInfo.titleFileFolder, storageInfo.titleFileName);
    tasks.unshift(Task.createTitleTask(filename, info.clipId));
  }

  tasks = Task.rmReduplicate(tasks);

  // info.paths is used to delete files.
  info.paths = [];
  if (storageConfig.saveInfoFile) {

    // calculate path
    info.paths.push(storageInfo.infoFileName);
    const {mainPath, paths} = Task.getRelativePath(
      tasks, storageInfo.infoFileFolder);
    info.mainPath = mainPath;
    info.paths.push(...paths);

    const filename = T.joinPath(storageInfo.infoFileFolder, storageInfo.infoFileName);
    tasks.unshift(Task.createInfoTask(filename, info))
  } else {
    const mainFileTask = tasks.find(it => it.taskType === 'mainFileTask')
    if (mainFileTask) {
      // FIXME why should we set infoFileFolder ?
      // We assume infoFileFolder is same as mainFileFolder.
      const infoFileFolder = storageInfo.mainFileFolder;
      info.mainPath = T.calcPath(infoFileFolder, mainFileTask.filename);
    } else {
      throw Error("Can not find mainFileTask");
    }
  }

  const clipping = {
    info: info,
    tasks: Task.sort(tasks)
  };

  return clipping;
}


//private
function dealFormInputs({format = config.saveFormat, title, category, tagstr}) {
  title = title.trim();
  category = category.trim();

  if (title === "") { title = 'Untitled' }
  const tags = T.splitTagstr(tagstr);

  return {format, title, category, tags}
}

const Api = { getReadyToClip, clip }
export default Api;
