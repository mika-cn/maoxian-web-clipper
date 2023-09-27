"use strict";

import T             from '../lib/tool.js';
import Log           from '../lib/log.js';
import I18N          from '../lib/translation.js';
import ExtMsg        from '../lib/ext-msg.js';
import Task          from '../lib/task.js';
import RequestParams from '../lib/request-params.js'

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
 *   - {String} userAgent
 *
 * @return {Object}
 *   - {Object} userInput {:format, :title, :category, :tags}
 *   - {Object} info  - meta information
 *   - {Object} storageInfo
 *   - {Object} storageConfig
 *   - {Object} i18nLabel : some translated labels
 *   - {Object} requestParams
 *   - {FilenameConflictResolver} nameConflictResolver
 *
 */
function getReadyToClip(formInputs, config, {domain, pageUrl, userAgent}) {

  const userInput = dealFormInputs(formInputs, config);
  const i18nLabel = getI18nLabel();

  const now = Date.now();
  const tObj = T.wrapNow(now);

  const requestParams = new RequestParams({
    sessionId      : tObj.str.intSec,
    refUrl         : pageUrl,
    userAgent      : userAgent,
    referrerPolicy : config.requestReferrerPolicy,
    timeout        : config.requestTimeout,
    tries          : config.requestMaxTries,
  });


  const appendTags = [];
  if (config.saveDomainAsTag) {
    appendTags.push(domain);
  }

  let storageConfig = {};
  switch(config.clippingHandler) {
    case 'WizNotePlus':
      storageConfig = StorageConfig_WizNotePlus.get({config});
      break;
    default:
      // Browser or NativeApp
      storageConfig = StorageConfig_Default.get({config})
      break;
  }

  const {storageInfo, nameConflictResolver} = StorageConfigRender.exec(Object.assign(
    { storageConfig, now, domain},
    T.sliceObj(userInput, ['format', 'title', 'category']),
    {nameConflictResolver: T.createFilenameConflictResolver()})
  );
  Log.debug(storageInfo)

  // TODO consider me.
  userInput.category = storageInfo.category;

  // metas
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

  return {userInput, info, storageInfo, storageConfig, i18nLabel, requestParams, nameConflictResolver};
}


/**
 * Clip element
 *
 *
 * @param {Element} elem
 * @param {Object} params
 *   - {Object} config
 *   - {Object} info - current clpping information (metas)
 *   - {Object} storageInfo
 *   - {Object} storageconfig
 *   - {Object} i18nLabel : some translated labels
 *   - {Object} requestParams
 *   - {Object} pageMetas (fetch from <meta> tags)
 *   - {Array}  frames
 *   - {Window} win - window object
 *   - {Object} platform (browser info)
 *   - {FilenameConflictResolver} nameConflictResolver
 *
 * @return {Promise} a Promise that will resolve with clipping
 */
async function clip(elem, {config, info, storageInfo, storageConfig, i18nLabel, requestParams, pageMetas, frames, win, platform, nameConflictResolver}) {

  let Clipper = null;
  switch(info.format){
    case 'html' : Clipper = MxHtmlClipper; break;
    case 'md'   : Clipper = MxMarkdownClipper; break;
    default     : Clipper = MxHtmlClipper; break;
  }

  await ExtMsg.sendToBackend('clipping', {
    type: 'add.nameConflictResolver',
    body: {
      clipId: info.clipId,
      nameConflictResolverObject: nameConflictResolver.toObject()
    }
  });

  let tasks = await Clipper.clip(elem, {config, info, storageInfo, i18nLabel, requestParams, pageMetas, frames, win, platform});

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
    // So we don't need "paths" (No deletion) and "mainPath" (No history to open)
  }

  const clipping = {
    info: info,
    tasks: Task.sort(tasks)
  };

  return clipping;
}


//private
function dealFormInputs({format, title, category, tagstr}, config) {
  format   = (format   || "").trim();
  title    = (title    || "").trim();
  category = (category || "").trim();

  if (format === "") { format = (config.saveFormat || 'html') }
  if (title === "") { title = 'Untitled' }
  const tags = T.splitTagstr(tagstr);

  return {format, title, category, tags}
}

// These labels will be used in generating clipping information.
function getI18nLabel() {
  const dict = {};
  [
    ['i18n_none'         , 'g.label.none']            ,
    ['i18n_access'       , 'g.label.access']          ,
    ['i18n_original_url' , 'g.clipping.original-url'] ,
    ['i18n_category'     , 'g.clipping.category']     ,
    ['i18n_tags'         , 'g.clipping.tags']         ,
    ['i18n_created_at'   , 'g.clipping.created-at']   ,
  ].forEach((pair) => {
    dict[pair[0]] = I18N.t(pair[1]);
  });
  return dict;
}

const Api = { getReadyToClip, clip }
export default Api;
