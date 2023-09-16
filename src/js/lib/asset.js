"use strict";

import T   from './tool.js';
import md5 from 'blueimp-md5';
import VariableRender from './variable-render.js'
import ExtMsg from './ext-msg.js';
import {filetypemime} from 'magic-bytes.js';

/**
 * @param {Object} params
 * @param {String} params.url
 * @param {String} params.headers
 * @param {Integer} params.timeout (unit: seconds)
 * @param {Integer} params.tries
 * @param {String} [resourceType]
 *
 * @returns {String|null} mimeType
 */
async function getWebUrlMimeType(params, resourceType = 'misc') {
  try {
    const {url} = params;
    if (T.isDataUrl(url)) {
      return (await getDataUrlMimeType(url));
    }

    if (T.isBlobUrl(url)) {
      return (await getBlobUrlMimeType(url));
    }

    if(T.isUrlHasFileExtension(url) && isResourceTypeUrl({resourceType, url: url})) {
      // in these cases, we don't need webUrlMimeType.
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



function isResourceTypeUrl({resourceType, url, urlExt}) {
  switch (resourceType) {
    case 'image':
      {
      const extension = (urlExt || T.getUrlExtension(url));
      if (extension) {
        const mimeType = T.extension2MimeType(extension);
        return mimeType.startsWith('image/');
      } else {
        // We don't know
        return true;
      }
    }
    default: return true;
  }
}


function getValueObjectByLink({template, link, extension = null, mimeTypeData = {}, resourceType = 'misc'}) {
  let v = {};
  if (template.indexOf('$MD5URL') > -1) {
    v.md5url = md5(link);
  }
  if (template.indexOf('$FILENAME') > -1) {
    let filename = null;
    if (T.isDataUrl(link)) {
      filename = 'dataurl';
    } else {
      filename = T.removeFileExtensionTail(T.getUrlFilename(link));
    }
    const [name, _] = T.splitFilename(filename);
    v.filename = name;
  }
  if (template.indexOf('$EXT') > -1) {
    const ext = getWebUrlExtension(link, Object.assign({extension, resourceType}, mimeTypeData));
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


/**
 * handle linked assets (external styles, images, audios, videos, pdf...)
 *
 * @param {String} template (the configured assetFileName)
 * @param {Object} valueObj (contains value that will used to render the template)
 * @param {String} link (http:, https: or data:)
 * @param {String} [extension] (the filename extension)
 * @param {Object} mimeTypeData
 * @param {String} resourceType
 *
 * @returns {String} name
 */
function getNameByLink({template, valueObj, link, extension, mimeTypeData = {}, resourceType = 'misc'}) {
  const v = getValueObjectByLink({template, link, extension, mimeTypeData, resourceType});
  const name = VariableRender.exec(template, Object.assign(v, valueObj),
    VariableRender.AssetFilenameVariables);
  return name
}


/**
 * handle text assets (inline style, srcdoc frames...)
 *
 * @param {String} template (the configured assetFileName)
 * @param {Object} valueObj (contains value that will used to render the template)
 * @param {String} content (text assets' content)
 * @param {String} [name]  (the filename without extension)
 * @param {String} [extension] (the filename extension)
 *
 * @returns {String} name
 */
function getNameByContent({template, valueObj, content, name, extension}) {
  const v = getValueObjectByContent({template, content, name, extension});
  return VariableRender.exec(template, Object.assign(v, valueObj),
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
 *   - {String} [id]
 *   - {String} clipId
 *   - {String} resourceType
 *
 * @return {Object} {:filename, :path}
 */
async function getFilenameAndPath(params) {

  const {link, storageInfo, extension = null,
    mimeTypeData = {}, id, clipId, resourceType = 'misc'} = params;

  const name = getNameByLink({
    template: storageInfo.raw.assetFileName,
    valueObj: storageInfo.valueObj,
    link: link,
    extension: extension,
    mimeTypeData: mimeTypeData,
    resourceType: resourceType,
  });

  const assetName = await getUniqueName({
    clipId: clipId,
    id: (id || link),
    folder: storageInfo.assetFolder,
    filename: name
  });

  const filename = T.joinPath(storageInfo.assetFolder, assetName);
  const path = T.calcPath(storageInfo.mainFileFolder, filename);
  return {filename, path}
}


/**
 * WARNING: This function don't handle data urls and blob urls inside,
 *          you should handle it beforehand and pass it as webUrlMimeType
 *
 * @param {String} link
 * @param {Object} options
 * @param {String} [options.extension]
 * @param {String} [options.mimeType] - if we only have one mimeType.
 * @param {String} [options.webUrlMimeType] - from http request, data url, blob url ...
 * @param {String} [options.attrMimeType] - from attribute of HTML tag
 * @param {String} [options.resourceType]
 *
 * @returns {String|null} extension
 */
function getWebUrlExtension(link, {extension, mimeType, webUrlMimeType, attrMimeType, resourceType = 'misc'}) {
  try {
    if (extension) { return extension }

    let url = new URL(link);
    if (url.protocol === 'data:' || url.protocol == 'blob:') {
      if (mimeType)       { return T.mimeType2Extension(mimeType) }
      if (webUrlMimeType) { return T.mimeType2Extension(webUrlMimeType); }
      if (attrMimeType)   { return T.mimeType2Extension(attrMimeType); }
      return null;
    } else {
      if (!url.pathname) { return null }
      const urlExt = T.getUrlExtension(url.href)
      if (urlExt && isResourceTypeUrl({resourceType, urlExt})) {
        return urlExt;
      } else {
        if (mimeType)       { return T.mimeType2Extension(mimeType) }
        if (webUrlMimeType) { return T.mimeType2Extension(webUrlMimeType); }
        if (attrMimeType)   { return T.mimeType2Extension(attrMimeType); }
        return null;
      }
    }
  } catch(e) {
    // invalid url
    console.warn('invalid web url: ', link, e);
    console.trace();
    return null;
  }
}

const BIN_STREAM = 'application/octet-stream';

async function getDataUrlMimeType(url) {
  //data:[<mediatype>][;base64],<data>
  const [mimeType, encoding, data] = (new URL(url)).pathname.split(/[;,]{1}/);
  if (mimeType && mimeType !== BIN_STREAM) {
    return mimeType;
  }
  if (encoding && encoding == 'base64') {
    const blob = T.base64StrToBlob(data);
    return await getBlobMimeType(blob);
  } else {
    return null;
  }
}


async function getBlobUrlMimeType(url) {
  const resp = await window.fetch(url);
  const blob = await resp.blob();
  return await getBlobMimeType(blob);
}


async function getBlobMimeType(blob) {
  const mimeType = blob.type;
  if (mimeType && mimeType !== BIN_STREAM) {
    return mimeType;
  }

  // try detect mime type through magic number (file signatrue)
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const mimeTypes = filetypemime(bytes);
  if (mimeTypes.length > 0) {
    if (mimeTypes.length > 1) {console.debug(mimeTypes)}
    const it = mimeTypes[0];
    return (it && it !== BIN_STREAM ? it : null);
  } else {
    return null;
  }
}

export default {
  md5,
  getNameByLink,
  getNameByContent,
  getUniqueName,
  getFilename,
  getFilenameAndPath,
  getWebUrlMimeType,
  getWebUrlExtension,
}
