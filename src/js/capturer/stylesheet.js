

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
  // @return path;
  return async ({ownerType, resourceType, cssText, baseUrl, url}) => {
    const saveResource = (
         resourceType == 'css'   && true
      || resourceType == 'image' && config.htmlCaptureCssImage == 'saveAll'
      || resourceType == 'font'  && saveWebFont(config, url)
    );

    if (!saveResource) { return '' }


    const extension = (resourceType == 'css' ? 'css' : undefined);

    const httpMimeType = await Asset.getHttpMimeType(requestParams.toParams(url));

    const name = Asset.getNameByLink({
      template: storageInfo.raw.assetFileName,
      link: url,
      extension: extension,
      mimeTypeData: {httpMimeType},
      now: storageInfo.valueObj.now,
    });

    const assetName = await Asset.getUniqueName({
      clipId: clipId,
      id: url,
      folder: storageInfo.assetFolder,
      filename: name
    });

    const filename = T.joinPath(storageInfo.assetFolder, assetName);

    let task;

    switch(resourceType) {
      case 'image': tasks.push(Task.createImageTask(filename, url, clipId, requestParams)); break;
      case 'font' : tasks.push(Task.createFontTask(filename, url, clipId, requestParams)); break;
      case 'css'  : tasks.push(Task.createStyleTask(filename, cssText, clipId)); break;
      default:
        throw new Error("Unknown resourceType: " + resourceType)
    }


    if(baseUrl === docBaseUrl) {
      // In this case, it means this asset is referred by document (top document or iframe).
      // We need to calculate path that relative to mainFileFolder,
      // which is the place that the document will be saved in.
      return T.calcPath(storageInfo.mainFileFolder, filename);
    } else {
      // This asset is referred by an external style which is also an asset.
      // So they will stay in same folder.
      return assetName;
    }
  }
}


// save web font or not?
// returns a boolean value.
function saveWebFont(config, url) {
  const option = config.htmlCaptureWebFont;
  let filterText;
  switch(config.htmlCaptureWebFont) {
    case 'remove': return false;
    case 'saveAll': return true;
    case 'saveWoff': {
      filterText = 'woff,woff2';
      break;
    }
    case 'filter': {
      filterText = config.htmlWebFontFilter;
      break;
    }
  }
  return CaptureTool.isFilterMatch(filterText, url);
}


function fixBodyChildrenStyle(css) {
  const cssBodyExp = /(^|[\{\}\s,;]{1})(body\s*>\s?)/igm;
  return css.replace(cssBodyExp, function(match, p1, p2){
    return match.replace(p2, "body > .mx-wc-main > ");
  });
}


export default {captureStyleSheet, captureStyleObj, fixBodyChildrenStyle};

