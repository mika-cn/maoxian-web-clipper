;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('./tool.js'),
      require('blueimp-md5')
    );
  } else {
    // browser or other
    root.MxWcAsset = factory(
      root.MxWcTool,
      root.md5
    );
  }
})(this, function(T, md5, undefined) {
  "use strict";

  // link http:, https: or data:
  function getNameByLink({link, extension, mimeType, prefix}) {
    const name = generateName(link, prefix);
    const ext  = getFileExtension(link, extension, mimeType);
    return ext ? [name, ext].join('.') : name;
  }

  function getNameByContent({content, extension, prefix}) {
    const name = generateName(content, prefix);
    const ext = extension;
    return ext ? [name, ext].join('.') : name;
  }

  function getFilename({storageInfo, assetName}) {
    return T.joinPath(storageInfo.assetFolder, assetName);
  }

  function getPath({storageInfo, assetName}) {
    return T.joinPath(storageInfo.assetRelativePath, assetName);
  }

  function calcInfo(link, storageInfo, mimeType, prefix) {
    const assetName = getNameByLink({
      link: link,
      prefix: prefix,
      mimeType: mimeType
    });

    return {
      filename: getFilename({storageInfo, assetName}),
      path: getPath({storageInfo, assetName})
    }
  }


  /**
   * Generate asset name according to content
   *
   * @param {String} identifier
   *   Normally, it's a url
   *
   * @param {String} prefix - optional
   *   Use prefix to avoid asset name conflict.
   *   currently we use clipId as prefix.
   *
   * @return {String} the generated asset name
   *
   */
  function generateName(identifier, prefix) {
    const parts = [];
    parts.push(md5(identifier))
    if (prefix) { parts.unshift(prefix); }
    return parts.join('-');
  }

  function getFileExtension(link, extension, mimeType) {
    try{
      let url = new URL(link);
      if(url.protocol === 'data:') {
        //data:[<mediatype>][;base64],<data>
        const mimeType = url.pathname.split(';')[0];
        return mimeType2Extension(mimeType);
      } else {
        // http OR https
        if(extension) { return extension }
        let ext = T.getUrlExtension(url.href)
        if(ext) {
          return ext;
        } else {
          if(mimeType) {
            return mimeType2Extension(mimeType);
          } else {
            return null;
          }
        }
      }
    } catch(e) {
      // invalid link
      console.warn('mx-wc', e);
      return null;
    }
  }

  /*
   *
   * FIXME
   * The image formats supported by Firefox are:
   *
   * - JPEG
   * - GIF, including animated GIFs
   * - PNG
   * - APNG
   * - SVG
   * - BMP
   * BMP ICO
   * - PNG ICO
   * - WebP
   */
  function mimeType2Extension(mimeType) {
    const ext = {
      'text/plain'    : 'txt',
      'text/css'      : 'css',
      'image/gif'     : 'gif',
      'image/apng'    : 'apng',
      'image/png'     : 'png',
      'image/bmp'     : 'bmp',
      'image/x-ms-bmp': 'bmp',
      'image/jpeg'    : 'jpg',
      'image/svg+xml' : 'svg',
      'image/x-icon'  : 'ico',
      'image/webp'    : 'webp',
    }[mimeType]
    return ext;
  }

  return {
    getNameByLink: getNameByLink,
    getNameByContent: getNameByContent,
    getFilename: getFilename,
    getPath: getPath,
    calcInfo: calcInfo,
  }
});
