;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/tool.js'),
      require('../lib/asset.js'),
      require('../lib/task.js')
    );
  } else {
    // browser or other
    root.MxWcCaptureTool = factory(
      root.MxWcTool,
      root.MxWcAsset,
      root.MxWcTask
    );
  }
})(this, function(T, Asset, Task, undefined) {
  "use strict";

  /**
   * capture srcset of <img> element
   * and <source> element in <picture>
   * @return {Array} imagetasks
   */
  function captureImageSrcset(node, {baseUrl, storageInfo, clipId, mimeTypeDict = {}}) {
    const srcset = node.getAttribute('srcset');
    const tasks = [];
    if (srcset) {
      const arr = parseSrcset(srcset);
      let mimeType = null;
      if (node.tagName.toLowerCase() === 'source') {
        mimeType = node.getAttribute('type');
      }
      const newSrcset = arr.map((item) => {
        const [itemSrc] = item;
        const {isValid, url, message} = T.completeUrl(itemSrc, baseUrl);
        if (isValid) {
          if (!mimeType) { mimeType = mimeTypeDict[url] }
          const {filename, path} = Asset.calcInfo(url, storageInfo, mimeType, clipId);
          const task = Task.createImageTask(filename, url, clipId);
          tasks.push(task);
          item[0] = path;
        } else {
          item[0] = 'invalid-url.png';
        }
        return item.join(' ');
      }).join(',');
      node.setAttribute('srcset', newSrcset);
    }
    return {node, tasks};
  }

  /**
   *
   * @param {String} srcset
   *
   * @return {Array} srcset
   *   - {Array} item
   *     - {String} url
   *     - {String} widthDescriptor
   *      or pixelDensityDescriptor (optional)
   *
   */
  function parseSrcset(srcset) {
    const result = [];
    let currItem = [];
    let str = '';
    for (let i = 0; i < srcset.length; i++) {
      const currChar = srcset[i];
      switch(currChar) {
        case ',':
          const nextChar = srcset[i + 1];
          if (// is going to start a new item
              nextChar && nextChar === ' '
              // or current str is a descriptor
              // (end of item)
            || str.match(/^[\d\.]+[xw]{1}$/)
          ) {
            if (str !== '') {
              currItem.push(str);
              result.push(Array.of(...currItem));
              str = '';
              currItem = [];
            }
          } else {
            str += currChar;
          }
          break;
        case ' ':
          if (str !== '') {
            currItem.push(str);
            str = '';
          }
          break;
        default:
          str += currChar
      }
    }
    if (str !== '') {
      currItem.push(str);
      result.push(Array.of(...currItem));
      str = '';
      currItem = [];
    }
    return result;
  }

  function getRequestHeaders(url, headerParams) {
    const {refUrl, userAgent, referrerPolicy} = headerParams;
    const headers = { 'User-Agent' : userAgent };

    const referer = getReferrerHeader(
      headerParams.refUrl, url,
      headerParams.referrerPolicy
    );

    if (referer) {
      headers['Referer'] = referer;
    }

    const origin = getOriginHeader(refUrl, url);
    if (origin) {
      headers['Origin'] = origin;
    }

    return headers;
  }

  /*
   * @param {String} policy - see <img>'s attribute referrerpolicy for details.
   */
  function getReferrerHeader(refUrl, targetUrl, policy) {
    if (isDowngradeHttpRequest(refUrl, targetUrl)) {
      // no-referrer-when-downgrade
      return null;
    }
    switch (policy) {
      case 'originWhenCrossOrigin':
        const u = new URL(refUrl);
        const t = new URL(targetUrl);
        if (u.origin !== t.origin) {
          return u.origin;
        } else {
          break;
        }
      case 'origin':
        return (new URL(refUrl)).origin;
      case 'noReferer':
        return null;
      case 'unsafeUrl':
      default: break;
    }

    if (refUrl.indexOf('#') > 0) {
      return refUrl.split('#')[0];
    } else {
      return refUrl;
    }
  }

  function getOriginHeader(refUrl, targetUrl) {
    if (isDowngradeHttpRequest(refUrl, targetUrl)) {
      // not origin when downgrade request
      return null;
    }
    const u = new URL(refUrl);
    const t = new URL(targetUrl);
    return u.origin === t.origin ? null : u.origin;
  }

  function isDowngradeHttpRequest(fromUrl, toUrl) {
    return fromUrl.match(/^https:/i) && toUrl.match(/^http:/i)
  }



  return {
    captureImageSrcset: captureImageSrcset,
    parseSrcset: parseSrcset,
    getRequestHeaders: getRequestHeaders,
  }

});

