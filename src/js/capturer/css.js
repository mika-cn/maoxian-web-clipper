;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    const process = require('process');
    if (process.env.MX_WC_TESTING) {
      module.exports = factory;
    } else {
      module.exports = factory(
        require('strip-css-comments'),
        require('../lib/log.js'),
        require('../lib/tool.js'),
        require('../lib/asset.js'),
        require('../lib/task.js'),
        require('../lib/ext-msg.js'),
        require('./tool.js'),
      );
    }
  } else {
    // browser or other
    root.MxWcCapturerCss = factory(
      root.stripCssComments,
      root.MxWcLog,
      root.MxWcTool,
      root.MxWcAsset,
      root.MxWcTask,
      root.MxWcExtMsg,
      root.MxWcCaptureTool
    );
  }
})(this, function(stripCssComments, Log,  T, Asset, Task, ExtMsg, CaptureTool, undefined) {
  "use strict";

  /**
   * Capture CSS link
   *
   * @param {Object} opts
   *   - {String} link
   *   - {String} baseUrl
   *   - {String} docUrl
   *   - {Object} storageInfo
   *   - {String} clipId
   *   - {Object} mimeTypeDict
   *   - {Object} config
   *   - {Object} headerParams
   *   - {Boolean} needFixStyle
   *
   * @return {Array} tasks
   *
   */
  async function captureLink(params) {
    const {baseUrl, docUrl, storageInfo, clipId, mimeTypeDict={}, config, headerParams, needFixStyle} = params;

    const {isValid, url, message} = T.completeUrl(params.link, baseUrl);
    if (!isValid) {
      console.warn("<mx-wc>", message);
      return [];
    }

    try {
      const {fromCache, result: text} = await ExtMsg.sendToBackground({
        type: 'fetch.text',
        body: {
          clipId: clipId,
          url: url,
          headers: CaptureTool.getRequestHeaders(url, headerParams),
          timeout: config.requestTimeout,
        }
      });

      if (fromCache) {
        // processed.
        return [];
      } else {
        // Use url as baseUrl
        const {cssText, tasks} = await captureText(Object.assign({baseUrl: url, docUrl: docUrl}, {
          text, storageInfo, clipId, mimeTypeDict, config, headerParams, needFixStyle
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
   *   - {String} baseUrl - url of css text
   *   - {String} docUrl  - url of document
   *   - {Object} storageInfo
   *   - {String} clipId
   *   - {Object} mimeTypeDict
   *   - {Object} config
   *   - {Object} headerParams
   *   - {Boolean} needFixStyle
   *
   * @return {Array}
   *   - {String} cssText
   *   - {Array}  tasks
   */
  async function captureText(params) {
    const {baseUrl, docUrl, storageInfo, clipId, mimeTypeDict={}, config, headerParams, needFixStyle} = params;
    let {text: styleText} = params;
    const taskCollection = [];
    // FIXME danger here (order matter)
    const rule1 = {regExp: /url\("[^\)]+"\)/gm, template: 'url("$PATH")', separator: '"'};
    const rule2 = {regExp: /url\('[^\)]+'\)/gm, template: 'url("$PATH")', separator: "'"};
    const rule3 = {regExp: /url\([^\)'"]+\)/gm, template: 'url("$PATH")', separator: /\(|\)/ };

    const rule11 = {regExp: /@import\s+url\("[^\)]+"\)/igm, template: '@import url("$PATH")', separator: '"'};
    const rule12 = {regExp: /@import\s+url\('[^\)]+'\)/igm, template: '@import url("$PATH")', separator: "'"};
    const rule13 = {regExp: /@import\s+url\([^\)'"]+\)/igm, template: '@import url("$PATH")', separator: /\(|\)/ };

    const rule14 = {regExp: /@import\s*'[^;']+'/igm, template: '@import url("$PATH")', separator: "'"};
    const rule15 = {regExp: /@import\s*"[^;"]+"/igm, template: '@import url("$PATH")', separator: '"'};

    styleText = stripCssComments(styleText);

    const commonParams = { baseUrl, docUrl, clipId, storageInfo, mimeTypeDict };

    // fonts
    const fontRegExp = /@font-face\s?\{[^\}]+\}/gm;
    let result = parseAsset(Object.assign({
      styleText: styleText,
      regExp: fontRegExp,
      rules: [rule1, rule2, rule3],
      taskType: 'fontFileTask',
      saveAsset: config.saveWebFont,
    }, commonParams));
    styleText = result.styleText;
    taskCollection.push(...result.tasks);

    // background
    const bgRegExp = /background:([^:;]*url\([^\)]+\)[^:;]*)+;/img;
    result = parseAsset(Object.assign({
      styleText: styleText,
      regExp: bgRegExp,
      rules: [rule1, rule2, rule3],
      taskType: 'imageFileTask',
      saveAsset: config.saveCssImage,
    }, commonParams));
    styleText = result.styleText;
    taskCollection.push(...result.tasks);


    // background-image
    const bgImgRegExp = /background-image:([^:;]*url\([^\)]+\)[^:;]*)+;/img;
    result = parseAsset(Object.assign({
      styleText: styleText,
      regExp: bgImgRegExp,
      rules: [rule1, rule2, rule3],
      taskType: 'imageFileTask',
      saveAsset: config.saveCssImage,
    }, commonParams));
    styleText = result.styleText;
    taskCollection.push(...result.tasks);

    // border-image
    const borderImgExp = /border-image:([^:;]*url\([^\)]+\)[^:;]*)+;/img;
    result = parseAsset(Object.assign({
      styleText: styleText,
      regExp: borderImgExp,
      rules: [rule1, rule2, rule3],
      taskType: 'imageFileTask',
      saveAsset: config.saveCssImage,
    }, commonParams));
    styleText = result.styleText;
    taskCollection.push(...result.tasks);



    // @import css
    const cssRegExp = /@import[^;]+;/igm;
    result = parseAsset(Object.assign({
      styleText: styleText,
      regExp: cssRegExp,
      rules: [rule11, rule12, rule13, rule14, rule15],
      extension: 'css',
      saveAsset: true
    }, commonParams));
    styleText = result.styleText;

    // convert css url task to text task.

    for(let i = 0; i < result.tasks.length; i++) {
      const tasks = await captureLink(Object.assign({
        link: result.tasks[i].url,
        config: config,
        headerParams: headerParams,
        needFixStyle: needFixStyle,
      }, commonParams));
      taskCollection.push(...tasks);
    }

    if (needFixStyle) {
      styleText = fixBodyChildrenStyle(styleText);
    }

    return {cssText: styleText, tasks: taskCollection};
  }


  function parseAsset(params) {
    const  {regExp, clipId, baseUrl, docUrl, rules, storageInfo,
      taskType, extension, mimeTypeDict, saveAsset} = params;

    let {styleText} = params;
    const taskCollection = [];
    styleText = styleText.replace(regExp, (match) => {
      const r = parseTextUrl({
        clipId: clipId,
        cssText: match,
        baseUrl: baseUrl,
        docUrl: docUrl,
        rules: rules,
        storageInfo: storageInfo,
        extension: extension,
        mimeTypeDict: mimeTypeDict,
        taskType: taskType,
        saveAsset: saveAsset,
      });
      taskCollection.push(...r.tasks);
      return r.cssText;
    });
    return {styleText: styleText, tasks: taskCollection};
  }

  function parseTextUrl(params) {
    const {clipId, baseUrl, docUrl, rules, storageInfo, taskType,
      extension, mimeTypeDict, saveAsset} = params;

    let cssText = params.cssText;
    const tasks = [];
    const getReplace = function(rule){
      return function(match){
        const part = match.split(rule.separator)[1].trim();
        const {isValid, url, message} = T.completeUrl(part, baseUrl);
        if (!isValid) {
          //FIXME
          return rule.template.replace('$PATH', '');
        }
        if(T.isDataUrl(url) || T.isHttpUrl(url)) {

          if(saveAsset){
            const assetName = Asset.getNameByLink({
              link: url,
              extension: extension,
              prefix: clipId,
              mimeTypeData: {httpMimeType: mimeTypeDict[url]}
            });
            const filename = Asset.getFilename({storageInfo, assetName});
            tasks.push(Task.createUrlTask(filename, url, clipId, taskType));
            if(baseUrl === docUrl){
              return rule.template.replace('$PATH', Asset.getPath({storageInfo, assetName}));
            }else{
              return rule.template.replace('$PATH', assetName);
            }
          } else {
            // set path to blank
            return rule.template.replace('$PATH', '');
          }
        } else {
          return match;
        }
      }
    }
    T.each(rules, function(rule){
      cssText = cssText.replace(rule.regExp, getReplace(rule));
    });
    return { cssText: cssText, tasks: tasks };
  }

  function fixBodyChildrenStyle(css) {
    // We wrap captured html in a div (with class mx-wc-main),
    // So we should fix this.
    const cssBodyExp = /(^|[\{\}\s,;]{1})(body\s*>\s?)/igm;
    return css.replace(cssBodyExp, function(match, p1, p2){
      return match.replace(p2, "body > .mx-wc-main > ");
    });
  }


  return {
    captureText: captureText,
    captureLink: captureLink
  }
});
