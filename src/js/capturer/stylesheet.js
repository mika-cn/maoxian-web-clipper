

import T     from '../lib/tool.js';
import Asset from '../lib/asset.js';
import Task  from '../lib/task.js';
import WhiteSpace from '../lib/white-space.js';
import StyleSheetSnapshot from '../snapshot/stylesheet.js';
import CaptureTool from './tool.js';

/*
 * @param {Object} params
 *   - {String} ownerType 'syleNode' or 'linkNode'
 *   - {String} baseUrl
 *   - {String} docBaseUrl - document's base url
 *   - {Object} storageInfo
 *   - {String} clipId
 *   - {Object} config
 *   - {Object} requestParams
 *   - {Object} cssParams
 *   - {Boolean} cssParams.needFixStyle
 *   - {Boolean} cssParams.removeUnusedRules
 *   - {Object}  cssParams.usedFont
 *   - {Object}  cssParams.usedKeyFrames
 *
 * @return {Object} it {:cssText, :tasks}
 */

async function captureStyleSheet(sheet, params) {
  const tasks = [];
  const {baseUrl, config, ownerType, cssParams} = params;
  const whiteSpace = WhiteSpace.create({compress: config.htmlCompressCss});

  const resourceHandler = getResourceHandler(Object.assign({tasks}, params));
  const cssText = await StyleSheetSnapshot.sheet2String(sheet,
    {baseUrl, ownerType, cssParams, resourceHandler, whiteSpace,});

  return {cssText, tasks};
}


/*
 * @param {Object} params
 *   - {String} ownerType 'syleNode' or 'styleAttr'
 *   - {String} baseUrl
 *   - {String} docBaseUrl - document's baseUrl
 *   - {Object} storageInfo
 *   - {String} clipId
 *   - {Object} config
 *   - {Object} requestParams
 *
 * @return {Object} it {:cssText, :tasks}
 */
async function captureStyleObj(styleObj, params) {
  const tasks = [];
  const {baseUrl, config, ownerType} = params;
  const whiteSpace = WhiteSpace.create({
    compress: (ownerType === 'styleAttr' ? true : config.htmlCompressCss)
  });

  const resourceHandler = getResourceHandler(Object.assign({tasks}, params));
  const cssText = await StyleSheetSnapshot.styleObj2String(styleObj,
    {baseUrl, ownerType, resourceHandler, whiteSpace});

  return {cssText, tasks};
}



function getResourceHandler(params) {
  const {tasks, ownerType, baseUrl, docBaseUrl, storageInfo, clipId, config, requestParams} = params;
  // @return paths;
  return async ({ownerType, resourceType, baseUrl, resourceItems}) => {

    const [isCSS, isImage, isFont] = [
      resourceType == 'css',
      resourceType == 'image',
      resourceType == 'font',
    ];
    const removeUnusedRules = (config.htmlCaptureCssRules === 'saveUsed');

    const boolFlags = (
         isCSS   && saveAll(resourceItems)
      || isImage && getImageFlags(resourceItems, config)
      || isFont  && getWebFontFlags(resourceItems, config)
    );

    const paths = [];
    for (let i = 0; i < resourceItems.length; i++) {
      const {url, cssText} = resourceItems[i];
      const saveResource = boolFlags[i];
      if (!saveResource) {
        paths.push('');
        continue;
      }

      const extension = (isCSS ? 'css' : undefined);

      const mimeTypeData = {};
      if (!cssText) {
        // images or fonts
        mimeTypeData.httpMimeType = await Asset.getHttpMimeType(
          requestParams.toParams(url), resourceType);
      }

      const name = Asset.getNameByLink({
        template: storageInfo.raw.assetFileName,
        valueObj: storageInfo.valueObj,
        link: url,
        extension: extension,
        mimeTypeData: mimeTypeData,
        resourceType: resourceType,
      });

      let id = url;
      if (isCSS && removeUnusedRules) {
        // If there are more than one external stylesheet (on different frame)
        // reference to the same URL.
        // Then these stylesheets may have different content due to
        // the "removeUnusedRules" behavier.
        //
        // It's better to merge these stylesheets to one file (for a small size saving)
        // but it's too complecated.
        //
        //   * It needs to travese the whole tree.
        //   * One stylesheet may import another stylesheet, and the imported one may
        //     have different content too.
        //
        // Currently, we only save these different stylesheets as differnet files

        id = url + '#' + Asset.md5(cssText || "-");
      }

      const assetName = await Asset.getUniqueName({
        clipId: clipId,
        id: id,
        folder: storageInfo.assetFolder,
        filename: name
      });

      const filename = T.joinPath(storageInfo.assetFolder, assetName);

      let task;
      switch(resourceType) {
        case 'image': {
          task = Task.createImageTask(filename, url, clipId, requestParams);
          break;
        }
        case 'font' : {
          task = Task.createFontTask(filename, url, clipId, requestParams);
          break;
        }
        case 'css'  : {
          task = Task.createStyleTask(filename, cssText, clipId);
          break;
        }
        default:
          throw new Error("Unknown resourceType: " + resourceType)
      }
      tasks.push(task);


      if(baseUrl === docBaseUrl) {
        // In this case, it means this asset is referred by document (top document or iframe).
        // We need to calculate path that relative to mainFileFolder,
        // which is the place that the document will be saved in.
        paths.push(T.calcPath(storageInfo.mainFileFolder, filename));
      } else {
        // This asset is referred by an external style which is also an asset.
        // So they will stay in same folder.
        paths.push(assetName);
      }
    }
    return paths;
  }
}

// @returns {[boolean]} flags
function saveAll(resourceItems) { return resourceItems.map(() => true) }
function removeAll(resourceItems) { return resourceItems.map(() => false) }

// @return {[Boolean]} flags
function getImageFlags(resourceItems, config) {
  if (config.htmlCaptureCssImage == 'saveAll') {
    return saveAll(resourceItems);
  } else {
    return removeAll(resourceItems);
  }
}

// @return {[Boolean]} flags
function getWebFontFlags(resourceItems, config) {
  const option = config.htmlCaptureWebFont;
  switch(option) {
    case 'remove': return removeAll(resourceItems);
    case 'saveAll': return saveAll(resourceItems);
    case 'filterList': {
      return CaptureTool.matchFilterList(
        config.htmlWebFontFilterList,
        resourceItems,
        saveAll
      );
    }
    default: {
      throw new Error(`Unknow option, htmlCaptureWebFont : ${option}`);
    }
  }
}



function fixBodyChildrenStyle(css) {
  const cssBodyExp = /(^|[\{\}\s,;]{1})(body\s*>\s?)/igm;
  return css.replace(cssBodyExp, function(match, p1, p2){
    return match.replace(p2, "body > .mx-wc-main > ");
  });
}


export default {captureStyleSheet, captureStyleObj, fixBodyChildrenStyle};

