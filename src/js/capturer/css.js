"use strict";

import stripCssComments from 'strip-css-comments';
import Log              from '../lib/log.js';
import T                from '../lib/tool.js';
import Asset            from '../lib/asset.js';
import Task             from '../lib/task.js';
import ExtMsg           from '../lib/ext-msg.js';
import CaptureTool      from './tool.js';

/**
 * Capture CSS link
 *
 * @param {Object} opts
 *   - {String} link
 *   - {String} baseUrl
 *   - {String} docUrl
 *   - {Object} storageInfo
 *   - {String} clipId
 *   - {Object} config
 *   - {Object} requestParams
 *   - {Boolean} needFixStyle
 *
 * @return {Array} tasks
 *
 */
async function captureLink(params) {
  const {baseUrl, docUrl, storageInfo, clipId, config, requestParams, needFixStyle} = params;

  const {isValid, url, message} = T.completeUrl(params.link, baseUrl);
  if (!isValid) {
    console.warn("<mx-wc>", message);
    return [];
  }

  try {
    const {fromCache, result: text} = await ExtMsg.sendToBackend( 'clipping', {
      type: 'fetch.text',
      body: {
        clipId: clipId,
        url: url,
        headers: requestParams.getHeaders(url),
        timeout: requestParams.timeout,
        tries: requestParams.tries,
      }
    });

    if (fromCache) {
      // processed.
      return [];
    } else {
      // Use url as baseUrl
      const {cssText, tasks} = await captureText(Object.assign({baseUrl: url, docUrl: docUrl}, {
        text, storageInfo, clipId, config, requestParams, needFixStyle
      }));

      const assetName = Asset.getNameByLink({
        link: url,
        extension: 'css',
        prefix: clipId
      });
      const filename = Asset.getFilename({storageInfo, assetName});

      tasks.push(Task.createStyleTask(filename, cssText, clipId));
      return tasks;
    }
  } catch(err) {
    // Fetching text is rejected
    Log.error(`fetch.text request css (url:${url}) failed`, err.message);
    // it's fine.
    return [];
  }
}

/**
 * Capture CSS text
 *
 * @param {Object} opts
 *   - {String} text
 *   - {String} baseUrl
 *              This is the baseUrl of asset url(they may be relative).
 *              If text come from <style> tag or style attribute, then baseUrl is the web page's baseUrl
 *              If text come from <link rel="stylesheet">, then baseUrl is the href attribute of <link> tag
 *   - {String} docUrl
 *              url of document
 *   - {Object} storageInfo
 *   - {String} clipId
 *   - {Object} config
 *   - {Object} requestParams
 *   - {Boolean} needFixStyle
 *
 * @return {Array}
 *   - {String} cssText
 *   - {Array}  tasks
 */
async function captureText(params) {
  const {baseUrl, docUrl, storageInfo, clipId, config, requestParams, needFixStyle} = params;
  let {text: styleText} = params;
  const taskCollection = [];

  // FIXME danger here (order matter)

  const ruleA = {
    regExp: /url\("[^\)]+"\)/igm,
    separator: '"',
    baseUrl: baseUrl,
    getReplacement: getReplacement_common,
  };

  const ruleB = {
    regExp: /url\('[^\)]+'\)/igm,
    separator: "'",
    baseUrl: baseUrl,
    getReplacement: getReplacement_common,
  };

  const ruleC = {
    regExp: /url\([^\)'"]+\)/igm,
    separator: /\(|\)/,
    baseUrl: baseUrl,
    getReplacement: getReplacement_common,
  };

  // rules for import styles
  const rulexA = {
    regExp: /@import\s+url\("[^\)]+"\)\s*([^;]*);$/igm,
    separator: '"',
    baseUrl: baseUrl,
    getReplacement: getReplacement_style,
  };
  const rulexB = {
    regExp: /@import\s+url\('[^\)]+'\)\s*([^;]*);$/igm,
    separator: "'",
    baseUrl: baseUrl,
    getReplacement: getReplacement_style,
  };
  const rulexC = {
    regExp: /@import\s+url\([^\)'"]+\)\s*([^;]*);$/igm,
    separator: /\(|\)/,
    baseUrl: baseUrl,
    getReplacement: getReplacement_style,
  };

  const rulexD = {
    regExp: /@import\s*'[^;']+'\s*([^;]*);$/igm,
    separator: "'",
    baseUrl: baseUrl,
    getReplacement: getReplacement_style,
  };
  const rulexE = {
    regExp: /@import\s*"[^;"]+"\s*([^;]*);$/igm,
    separator: '"',
    baseUrl: baseUrl,
    getReplacement: getReplacement_style,
  };

  styleText = stripCssComments(styleText);

  const commonParams = { baseUrl, docUrl, clipId, storageInfo, requestParams };

  let parsedResult, result;

  // fonts
  const fontRegExp = /@font-face\s?\{[^\}]+\}/gm;
  parsedResult = parseAsset({
    styleText: styleText,
    regExp: fontRegExp,
    rules: [ruleA, ruleB, ruleC],
    saveAsset: config.saveWebFont,
  });
  result = await generateTasks(Object.assign({
    taskType: 'fontFileTask',
  }, commonParams, parsedResult));
  styleText = result.styleText;
  taskCollection.push(...result.tasks);



  // background
  const bgRegExp = /background:([^:;]*url\([^\)]+\)[^:;]*)+;/img;
  parsedResult = parseAsset({
    styleText: styleText,
    regExp: bgRegExp,
    rules: [ruleA, ruleB, ruleC],
    saveAsset: config.saveCssImage,
  });
  result = await generateTasks(Object.assign({
    taskType: 'imageFileTask',
  }, commonParams, parsedResult));
  styleText = result.styleText;
  taskCollection.push(...result.tasks);


  // background-image
  const bgImgRegExp = /background-image:([^:;]*url\([^\)]+\)[^:;]*)+;/img;
  parsedResult = parseAsset({
    styleText: styleText,
    regExp: bgImgRegExp,
    rules: [ruleA, ruleB, ruleC],
    saveAsset: config.saveCssImage,
  });
  result = await generateTasks(Object.assign({
    taskType: 'imageFileTask',
  }, commonParams, parsedResult));
  styleText = result.styleText;
  taskCollection.push(...result.tasks);


  // border-image
  const borderImgExp = /border-image:([^:;]*url\([^\)]+\)[^:;]*)+;/img;
  parsedResult = parseAsset({
    styleText: styleText,
    regExp: borderImgExp,
    rules: [ruleA, ruleB, ruleC],
    saveAsset: config.saveCssImage,
  });
  result = await generateTasks(Object.assign({
    taskType: 'imageFileTask',
  }, commonParams, parsedResult));
  styleText = result.styleText;
  taskCollection.push(...result.tasks);


  // @import css
  const cssRegExp = /@import[^;]+;/igm;
  parsedResult = parseAsset({
    styleText: styleText,
    regExp: cssRegExp,
    rules: [rulexA, rulexB, rulexC, rulexD, rulexE],
    saveAsset: true
  });
  result = await generateTasks(Object.assign({
    taskType: 'styleFileTask',
    extension: 'css'
  }, commonParams, parsedResult));
  styleText = result.styleText;

  // convert css url task to text task.
  for(let i = 0; i < result.tasks.length; i++) {
    const tasks = await captureLink(Object.assign({
      link: result.tasks[i].url,
      config: config,
      needFixStyle: needFixStyle,
    }, commonParams));
    taskCollection.push(...tasks);
  }

  if (needFixStyle) {
    styleText = fixBodyChildrenStyle(styleText);
  }


  return {cssText: styleText, tasks: taskCollection};
}


/**
 * Parse style text according to regular expression of asset
 *
 * @param {Object} params:
 *   - {String}  styleText
 *   - {RegExp}  regExp
 *   - {Array}   rules
 *   - {Boolean} saveAsset
 *
 * @return {Object}
 *   - {String} styleText
 *   - {Marker} marker
 */
function parseAsset(params) {
  const  {regExp, rules, saveAsset} = params;

  let {styleText} = params;
  let marker = T.createMarker();

  styleText = styleText.replace(regExp, (match) => {
    const r = parseTextUrl({
      cssText: match,
      rules: rules,
      marker: marker,
      saveAsset: saveAsset,
    });
    marker = r.marker;
    return r.cssText;
  });

  return {styleText: styleText, marker: marker};
}


/**
 * Parse style text according to rules, mark all target urls and collect them.
 *
 * @param {Object} params
 *   - {String}   cssText
 *   - {Array}    rules
 *   - {Marker}   marker
 *   - {Boolean}  svaeAsset
 *
 * @return {Object}
 *   - {String} cssText
 *   - {Marker} marker
 */
function parseTextUrl(params) {

  const {rules, marker, saveAsset} = params;
  let cssText = params.cssText;

  T.each(rules, function(rule){
    const replacement = rule.getReplacement(marker, saveAsset);
    cssText = cssText.replace(rule.regExp, replacement);
  });
  return { cssText: cssText, marker: marker};
}


/**
 * create a replacement function. It'll be Used on web fonts, css images.
 *
 * @param {Marker} marker
 *                 Used to collect url and replace it with a marker.
 * @param {Boolean} saveAsset
 *                  Whether to save asset or not.
 * @return {Function}
 */
function getReplacement_common(marker, saveAsset) {
  const {separator, baseUrl} = this;

  return function(match) {
    const path = match.split(separator)[1].trim();
    const {isValid, url, message} = T.completeUrl(path, baseUrl);
    if (!isValid) {
      const err = [message, `path: ${path}`].join(' ');
      //TODO add error message
      return 'url("")';
    }
    if(T.isDataUrl(url) || T.isHttpUrl(url)) {
      if(saveAsset){
        marker.values.push(url);
        return `url("${marker.next()}")`;
      } else {
        // set variable to blank
        return 'url("")';
      }
    } else {
      return match;
    }
  }
}


/**
 * create a replacement function. It'll be used on style import (@import url();)
 *
 * @param {Marker} marker
 *                 Used to collect url and replace it with a marker.
 * @param {Boolean} saveAsset
 *                  Whether to save asset or not. In this function it's always true.
 * @return {Function}
 */
function getReplacement_style(marker, saveAsset) {
  const {separator, baseUrl} = this;

  return function(match, p1) {
    const path = match.split(separator)[1].trim();
    const {isValid, url, message} = T.completeUrl(path, baseUrl);
    if (!isValid) {
      const err = [message, `path: ${path}`].join(' ');
      return `/*error: ${err}*/`;
    }
    if(T.isDataUrl(url) || T.isHttpUrl(url)) {
      marker.values.push(url);
      if (p1.trim() === "") {
        return `@import url("${marker.next()}");`;
      } else {
        return `@import url("${marker.next()}") ${p1.trim()};`;
      }
    } else {
      return match;
    }
  }
}


/**
 * Generate Task according to asset url, and replace marker back to asset path.
 *
 * @param {Object} params
 *   - {String} styleText
 *   - {Marker} marker
 *   - {String} baseUrl
 *   - {String} docUrl
 *   - {String} clipId
 *   - {Object} storageInfo
 *   - {Object} requestParams
 *   - {String} extension
 *   - {String} taskType
 *
 * @return {Object{
 *   - {String} styleText
 *   - {Array} tasks
 */
async function generateTasks(params) {
  const {baseUrl, docUrl, clipId, storageInfo,
    requestParams, extension, taskType} = params;
  let styleText = params.styleText;

  const tasks = [];
  const assetPaths = [];
  const urls = params.marker.values;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));
    const assetName = Asset.getNameByLink({
      link: url,
      extension: extension,
      prefix: clipId,
      mimeTypeData: {httpMimeType}
    });
    const filename = Asset.getFilename({storageInfo, assetName});
    tasks.push(Task.createUrlTask(filename, url, clipId, taskType));
    if(baseUrl === docUrl){
      assetPaths.push(Asset.getPath({storageInfo, assetName}));
    }else{
      assetPaths.push(assetName);
    }
  }

  styleText = params.marker.replaceBack(styleText, assetPaths)
  return {styleText: styleText, tasks}
}


/**
 * We wrap captured html in a div (with class mx-wc-main),
 * So we should fix this.
 */
function fixBodyChildrenStyle(css) {
  const cssBodyExp = /(^|[\{\}\s,;]{1})(body\s*>\s?)/igm;
  return css.replace(cssBodyExp, function(match, p1, p2){
    return match.replace(p2, "body > .mx-wc-main > ");
  });
}

export default {captureText, captureLink};
