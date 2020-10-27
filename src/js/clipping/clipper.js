"use strict";

import T      from '../lib/tool.js';
import Log    from '../lib/log.js';
import ExtMsg from '../lib/ext-msg.js';
import Task   from '../lib/task.js';

import StorageConfig_Default     from './storage-config-default.js';
import StorageConfig_WizNotePlus from './storage-config-wiznoteplus.js';
import StorageConfigRender       from './storage-config-render.js';

import MxHtmlClipper     from './clip-as-html.js';
import MxMarkdownClipper from './clip-as-markdown.js';

/**
 *
 * @param {Object} formInputs: {:format, :title, :category, :tagstr}
 * @param {Object} config
 * @param {Object} params
 *   - {String} domain
 *   - {String} pageUrl
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
      break;
    default:
      // Browser or NativeApp
      storageConfig = StorageConfig_Default.get({
        config: config
      })
      break;
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


/**
 * Clip element
 *
 *
 * @param {Element} elem
 * @param {Object} params
 *   - {Object} info - meta information
 *   - {Object} storageInfo
 *   - {Object} storageconfig
 *   - {Window} window object
 *
 * @return {Promise} a Promise that will resolve with clipping
 */
async function clip(elem, {info, storageInfo, config, storageConfig, win}) {
  let Clipper = null;
  switch(info.format){
    case 'html' : Clipper = MxHtmlClipper; break;
    case 'md'   : Clipper = MxMarkdownClipper; break;
  }

  let tasks = await Clipper.clip(elem, {info, storageInfo, config, win});

  if (storageConfig.saveTitleFile) {
    const filename = T.joinPath(storageInfo.titleFileFolder, storageInfo.titleFileName);
    tasks.unshift(Task.createTitleTask(filename, info.clipId));
  }

  tasks = Task.rmReduplicate(tasks);

  if (storageConfig.saveInfoFile) {
    // calculate path
    const {mainPath, paths} = Task.getRelativePath(
      tasks, storageInfo.infoFileFolder);
    info.mainPath = mainPath;

    // "paths" is used to delete clipping file
    // We save it in infoFile, but not in the browser.
    paths.unshift(storageInfo.infoFileName);

    const filename = T.joinPath(storageInfo.infoFileFolder, storageInfo.infoFileName);
    tasks.unshift(Task.createInfoTask(filename, Object.assign({}, info, {paths})))
  } else {
    // Do nothing in this condition.
    // We don't save info file and this clipping record.
    // So we don't need paths(No deletion) and mainPath(No history to open)
  }

  const clipping = {
    info: info,
    tasks: Task.sort(tasks)
  };

  return clipping;
}


//private
function dealFormInputs({format, title, category, tagstr}) {
  title = title.trim();
  category = category.trim();

  if (title === "") { title = 'Untitled' }
  const tags = T.splitTagstr(tagstr);

  return {format, title, category, tags}
}

const Api = { getReadyToClip, clip }
export default Api;
