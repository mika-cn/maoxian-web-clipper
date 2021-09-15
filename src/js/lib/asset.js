"use strict";

import T   from './tool.js';
import md5 from 'blueimp-md5';
import VariableRender from './variable-render.js'
import ExtMsg from './ext-msg.js';

// params: {:url, :headers, :timeout, :tries}
async function getHttpMimeType(params) {
  try {
    if (T.isDataUrl(params.url) || T.isUrlHasFileExtension(params.url)) {
      // in these cases, we don't need mimeType.
      return null;
    }
    const mimeType = await ExtMsg.sendToBackend('clipping', {
      type: 'get.mimeType',
      body: params
    });

    if ('__EMPTY__' === mimeType) {
      return null;
    } else {
      return mimeType;
    }
  } catch(e) {
    console.error(e);
    console.trace();
    return null;
  }
}

async function getUniqueName({clipId, id, folder, filename}) {
  const name = await ExtMsg.sendToBackend('clipping', {
    type: 'get.uniqueFilename',
    body: {clipId, id, folder, filename}
  });
  return name;
}


function getValueObjectByLink({template, link, extension = null, mimeTypeData = {}}) {
  let v = {};
  if (template.indexOf('$MD5URL') > -1) {
    v.md5url = md5(link);
  }
  if (template.indexOf('$FILENAME') > -1) {
    let filename = null;
    if (T.isDataUrl(link)) {
      filename = 'dataurl';
    } else {
      filename = T.getUrlFilename(link);
    }
    const [name, _] = T.splitFilename(filename);
    v.filename = name;
  }
  if (template.indexOf('$EXT') > -1) {
    const ext = getFileExtension(link, extension, mimeTypeData);
    v.ext = (ext ? `.${ext}` : '');
  }
  return v;
}


function getValueObjectByContent({template, content, name = "untitle", extension = null}) {
  let v = {};

  if (template.indexOf('$MD5URL') > -1) {
    v.md5url = md5(content);
  }

  if (template.indexOf('$FILENAME') > -1) {
    v.filename = name;
  }

  if (template.indexOf('$EXT') > -1) {
    v.ext = (extension ? `.${extension}` : '');
  }
  return v;
}

// link http:, https: or data:
function getNameByLink({template, link, extension, mimeTypeData = {}, now}) {
  const v = getValueObjectByLink({template, link, extension, mimeTypeData});
  const name = VariableRender.exec(template, Object.assign({now}, v),
    VariableRender.AssetFilenameVariables);
  return name
}

function getNameByContent({template, content, name, extension, now}) {
  const v = getValueObjectByContent({template, content, name, extension});
  return VariableRender.exec(template, Object.assign({now}, v),
    VariableRender.AssetFilenameVariables);
}

function getFilename({storageInfo, assetName}) {
  return T.joinPath(storageInfo.assetFolder, assetName);
}

/*
 * @param {Object} params
 *   - {String} link
 *   - {String} extension
 *   - {Object} mimeTypeData
 *   - {Object} storageInfo
 *   - {String} clipId
 *
 * @return {Object} {:filename, :path}
 */
async function getFilenameAndPath(params) {

  const {link, storageInfo, extension = null,
    mimeTypeData = {}, clipId} = params;

  const name = getNameByLink({
    template: storageInfo.raw.assetFileName,
    link: link,
    extension: extension,
    mimeTypeData: mimeTypeData,
    now: storageInfo.valueObj.now,
  });

  const assetName = await getUniqueName({
    clipId: clipId,
    id: link,
    folder: storageInfo.assetFolder,
    filename: name
  });

  const filename = T.joinPath(storageInfo.assetFolder, assetName);
  const path = T.calcPath(storageInfo.mainFileFolder, filename);
  return {filename, path}
}


function getFileExtension(link, extension, mimeTypeData) {
  const {
    // mime type that get from http request.
    httpMimeType,
    // mime type that get from attribute of HTML tag.
    attrMimeType
  } = (mimeTypeData || {});
  try {
    let url = new URL(link);
    if (url.protocol === 'data:') {
      //data:[<mediatype>][;base64],<data>
      const mimeType = url.pathname.split(';')[0];
      return T.mimeType2Extension(mimeType);
    } else {
      // http OR https
      if (extension) { return extension }
      const urlExt = T.getUrlExtension(url.href)
      if (urlExt) {
        return urlExt;
      } else {
        if(httpMimeType) { return T.mimeType2Extension(httpMimeType); }
        if(attrMimeType) { return T.mimeType2Extension(attrMimeType); }
        return null;
      }
    }
  } catch(e) {
    // invalid link
    console.warn('mx-wc', e);
    return null;
  }
}

export default {
  md5,
  getHttpMimeType,
  getNameByLink,
  getNameByContent,
  getUniqueName,
  getFilename,
  getFilenameAndPath,
}
