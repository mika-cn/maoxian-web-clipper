"use strict";

import Log    from '../lib/log.js';
import T      from '../lib/tool.js';
import ExtMsg from '../lib/ext-msg.js';


const StoreRedirection = (function() {
  const state = {};

  function listener(details) {
    const {type, url, redirectUrl} = details;
    state.redirectionStore.add(type, url, redirectUrl);
  }

  function initRedirectionStore() {
    const MIDDLE = 1, FINAL = 2;
    return {
      dict: {}, // url => {resourceType, targetUrl}
      redirectStatus: {}, // targetUrl => status
      add(resourceType, url, targetUrl) {
        if (url && targetUrl) {
          Log.info("Store Redirection", url, " => ", targetUrl);
          this.dict[url] = {resourceType, targetUrl};
          this.redirectStatus[targetUrl] = FINAL;
          if (this.redirectStatus[url] === FINAL) {
            this.redirectStatus[url] = MIDDLE;
          }
        } else {
          Log.warn("Invalid Redirection", url, targetUrl);
        }
      },
      isTarget(url) {
        return this.redirectStatus[url];
      },
      isMiddleTarget(url) {
        return this.redirectStatus[url] === MIDDLE;
      },
      isFinalTarget(url) {
        return this.redirectStatus[url] === FINAL;
      },
      getFinalDetail(url) {
        const detail = this.dict[url];
        if (detail) {
          if (this.isFinalTarget(detail.targetUrl)) {
            return detail;
          } else {
            return this.getFinalDetail(detail.targetUrl);
          }
        } else {
          return null;
        }
      },
      /**
       * @param {String} resourceType: 'image' or 'sub_frame'
       * @return {Object} dict : {url => targetUrl}
       */
      getRedirectionDict(resourceType = 'all') {
        const r = {};
        for (let url in this.dict) {
          if (this.isMiddleTarget(url)) {
            // Do nothing
          } else {
            const detail = this.getFinalDetail(url);
            if (resourceType === 'all' || detail.resourceType === resourceType ) {
              r[url] = detail.targetUrl;
            }
          }
        }
        return r;
      }
    }
  }

  function listen() {
    init();
    const filter = {
      urls: ["http://*/*", "https://*/*"],
      types: ["image", "sub_frame"]
    };

    browser.webRequest.onBeforeRedirect.removeListener(listener);
    browser.webRequest.onBeforeRedirect.addListener(listener, filter);
  }

  function init() {
    state.redirectionStore = initRedirectionStore();
  }

  function isTarget(url) {
    if (state.redirectionStore) {
      return state.redirectionStore.isTarget(url);
    } else {
      return false;
    }
  }

  function getRedirectionDict(resourceType = 'all') {
    if (state.redirectionStore) {
      return state.redirectionStore.getRedirectionDict(resourceType);
    } else {
      return {};
    }
  }

  return {
    listen: listen,
    isTarget: isTarget,
    getRedirectionDict: getRedirectionDict,
    // test only
    init: init,
    perform: listener,
  }
})();




const StoreMimeType = (function() {
  let state = {};

  function listener(details){
    if(details.type === 'xmlhttprequest'){
      handleXhr(details);
    }else{
      handleNormalRequest(details);
    }
  }

  function handleXhr(details){
    const {statusCode} = parseResponseStatusLine(details.statusLine);
    if(statusCode === '200') {
      const headers = details.responseHeaders;
      const mimeType = findMimeTypeFromHeaders(headers)
      if(['text/html', 'text/plain'].indexOf(mimeType) > -1){
        ExtMsg.sendToContent({type: "page_content.changed"});
      }
    } else {
      // 302 etc.
    }
  }

  function handleNormalRequest(details) {
    const {statusCode} = parseResponseStatusLine(details.statusLine);
    if (statusCode === '200') {
      state.mimeTypeStore.add(details.url, details.responseHeaders);
    } else {
      // 302 etc.
    }
  }

  function parseResponseStatusLine(statusLine) {
    // depends on statusLine's format. (could be dangerous)
    const strs = statusLine.split(" ");
    return {
      httpVersion: strs.shift(),
      statusCode: strs.shift(),
      statusText: strs.join(' ')
    }
  }


  function initMimeTypeStore(){
    const size = 300;
    return {
      dict: T.createMRUCache(size),
      add(url, responseHeaders) {
        if (StoreRedirection.isTarget(url)
          || !T.isUrlHasFileExtension(url)
        ) {
          this.dict.add(url, findMimeTypeFromHeaders(responseHeaders));
        }
      },
      get(url) {
        return this.dict.get(url);
      }
    };
  }

  /**
   * find mimeType from response headers.
   *
   * @param {Array} headers
   *        - {Object} header {:name, :value}
   * @return {String} mimeType or '__EMPTY__'
   */
  function findMimeTypeFromHeaders(headers){
    const header = T.getHeader(headers, 'content-type');
    // [firefox]
    //  will trigger two times sameUrl(notAll);
    //  one with Content-Type head, anotherOne is not
    // [Strange] attension or bug...
    // fixit.
    if (header) {
      return T.parseContentType(header.value).mimeType;
    } else {
      return '__EMPTY__';
    }
  }


  function init() {
    state.mimeTypeStore = initMimeTypeStore();
  }

  function listen() {
    init();
    const filter = {
      urls: ["http://*/*", "https://*/*"],
      types: [
        "xmlhttprequest",
        "image"
      ]
    };
    browser.webRequest.onHeadersReceived.removeListener(listener);
    browser.webRequest.onHeadersReceived.addListener(
      listener,
      filter,
      ["responseHeaders"]
    );
  }

  // WARNING We don't handle data url in this function
  function getMimeType(url) {
    const redirectionDict = StoreRedirection.getRedirectionDict('all');
    const targetUrl = redirectionDict[url];
    return state.mimeTypeStore.get(targetUrl || url);
  }

  return {
    listen: listen,
    getMimeType: getMimeType,
    // test only
    init: init,
    emit: listener,
  }
})();




const StoreResource = (function() {

  function listen() {
    if (Global.requestCacheSize < 1 || !(
      Global.requestCacheCss ||
      Global.requestCacheImage ||
      Global.requestCacheWebFont
    )) {
      // size is zero or three switches are off.
      Log.debug("Request Cache disabled");
      return;
    }

    if (browser.webRequest.filterResponseData) {

      const cacheTypes = [];
      if (Global.requestCacheCss)     { cacheTypes.push('stylesheet') }
      if (Global.requestCacheImage)   { cacheTypes.push('image') }
      if (Global.requestCacheWebFont) { cacheTypes.push('font') }

      const filter = {types: cacheTypes, urls: ["http://*/*", "https://*/*"]};

      browser.webRequest.onHeadersReceived.removeListener(listener);
      browser.webRequest.onHeadersReceived.addListener(
        listener,
        filter,
        ["blocking", "responseHeaders"]
      );
    } else {
      Log.debug("WebRequest.filterResponseData is not supported");
    }
  }

  function listener(details) {
    const filter = browser.webRequest.filterResponseData(details.requestId);
    const data = [];

    // when the filter is about to start receiving response data.
    filter.onstart = (event) => {
      // Log.debug("start...", details.url);
    }

    // when some response data has been received by the filter and is available to be examined or modified.
    filter.ondata = (event) => {
      Log.debug("data...", details.url);
      // event.data is a ArrayBuffer
      data.push(new Uint8Array(event.data));
      filter.write(event.data);
    }

    // when the filter has finished receiving response data.
    filter.onstop = (event) => {
      // Log.debug("stop...", details.url);
      let totalLength = 0;
      for (let buffer of data) {
        totalLength += buffer.length;
      }

      if (totalLength > 0) {
        const combinedArray = new Uint8Array(totalLength);
        let writeOffset = 0;
        while (writeOffset < totalLength) {
          const buffer = data.shift();
          combinedArray.set(buffer, writeOffset);
          writeOffset += buffer.length;
        }

        Global.evTarget.dispatchEvent({
          type: "resource.loaded",
          resourceType: details.type,
          url: details.url,
          responseHeaders: [...details.responseHeaders],
          data: combinedArray,
        });
      } else {
        // There are some weird cases that
        // ondata events are not emitted.
        // I guess it will happen when
        // the response is cached.
        //
        // Maybe these are preflight requests (NOT confirmed)
      }

      filter.disconnect();
    }

    // if an error has occurred in initializing and operating the filter.
    filter.onerror = (event) => {
      Log.debug("error...");
      Log.error(filter.error);
      filter.disconnect();
    };
  }

  return { listen };
})();





/**
 * This could be very dangerous,
 * We should only do this if requests are made by us.
 */
const UnescapeHeader = (function(){

  function listen() {
    const filter = {
      urls: ["http://*/*", "https://*/*"],
      types: [ "xmlhttprequest" ]
    };
    const extraInfoSpect = ["blocking", "requestHeaders"];

    const option = browser.webRequest.OnBeforeSendHeadersOptions;
    if (option && (option.hasOwnProperty('EXTRA_HEADERS') || option.hasOwnProperty('EXTRAHEADERS'))) {
      // Chrome needs `extraHeaders` to allow the modification of 'Referer' or 'Origin' (since chrome 72.0).
      // console.log('mx-wc', 'set extraHeaders');
      extraInfoSpect.push('extraHeaders');
    }
    browser.webRequest.onBeforeSendHeaders.removeListener(listener);
    browser.webRequest.onBeforeSendHeaders.addListener(listener, filter, extraInfoSpect);
  }


  function listener(details) {
    if (isSentByUs(details.requestHeaders)) {
      const originalHeaders = [];
      const modifiedHeaders = [];

      details.requestHeaders.forEach((header) => {
        if (header.name.toLowerCase() !== 'x-mxwc-token') {
          const regex = /^X-MxWc-/i;
          if (header.name.match(regex)) {
            // unescape header name
            const r = header.name.replace(regex, '');
            // capitalize
            const originalName = r.split('-').map((it) => {
              return [
                it.substring(0, 1).toUpperCase(),
                it.substring(1, it.length)
              ].join('')
            }).join('-');

            const whiteList = ['Referer', 'Origin'];
            if(whiteList.indexOf(originalName) > -1) {
              modifiedHeaders.push({name: originalName, value: header.value});
            } else {
              // Ignore other header (unsafe, wasn't set by us)
            }
          } else {
            originalHeaders.push({name: header.name, value: header.value});
          }
        }
      })

      // Record exist headers according to modified headers.
      const indexes = new Set();
      modifiedHeaders.forEach((modifiedHeader) => {
        originalHeaders.forEach((originalHeader, index) => {
          if (originalHeader.name.toLowerCase() === modifiedHeader.name.toLowerCase()) {
            indexes.add(index);
          }
        });
      });

      // Remove exist headers.
      const headers = [];
      originalHeaders.forEach((header, index) => {
        if (!indexes.has(index)) {
          headers.push(header);
        }
      });

      // Add modified headers.
      modifiedHeaders.forEach((header) => {
        if (header.value === '$REMOVE_ME') {
          // This flag ($REMOVE_ME) is just used to remove
          // headers that were set by User Agent.
          //
          // For example.
          // Firefox will set "Origin" header to moz-extension://...
          //
          // Some asset server will detect this and reject those requests.
        } else {
          headers.push(header);
        }
      });

      return {requestHeaders: headers};
    } else {
      return {requestHeaders: details.requestHeaders};
    }
  }

  function isSentByUs(requestHeaders) {
    return T.any(requestHeaders, (header) => {
      return (header.name.toLowerCase() === 'x-mxwc-token'
        && header.value === Global.requestToken);
    })
  }

  return {
    listen: listen,
    // test only
    perform: listener,
  }
})();



function listen() {
  StoreRedirection.listen();
  StoreMimeType.listen();
  UnescapeHeader.listen();
  StoreResource.listen();
}

function getMimeType(url) {
  return StoreMimeType.getMimeType(url);
}

function getRedirectionDict(resourceType = 'all') {
  return StoreRedirection.getRedirectionDict(resourceType);
}



/*
 * @param {Object} global
 *   - {String} requestToken
 *   - {EventTarget} evTarget
 *   - {Integer} requestCacheSize
 *   - {Boolean} requestCacheCss
 *   - {Boolean} requestCacheImage
 *   - {Boolean} requestCacheWebFont
 */
let Global = null;
function init(global) {
  Global = global;
}

const WebRequest = {
  init,
  listen,
  getMimeType,
  getRedirectionDict,
  // test only
  StoreRedirection,
  StoreMimeType,
  UnescapeHeader,
}

export default WebRequest;
