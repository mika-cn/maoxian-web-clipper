"use strict";

import Log from '../lib/log.js';
import T from '../lib/tool.js';
import ExtMsg from '../lib/ext-msg.js';

//const browser = require('webextension-polyfill');

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
      const mimeType = getMimeType(headers)
      if(['text/html', 'text/plain'].indexOf(mimeType) > -1){
        ExtMsg.sendToContent({type: "page_content.changed"});
      }
    } else {
      // 302 etc.
    }
  }

  function handleNormalRequest(details) {
    const {statusCode} = parseResponseStatusLine(details.statusLine);
    switch (statusCode) {
      case '200':
        state.mimeTypeStore.add(details.url, details.responseHeaders);
        break;
      case '301': // Move Permanently
      case '302': // Found
      case '303': // See Other
      case '307': // Temporary Redirect
        state.redirectionStore.add(details.url, details.responseHeaders);
        break;
      default: break;
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

  function getMimeType(headers){
    const header = T.getHeader(headers, 'content-type');
    // [firefox]
    //  will trigger two times sameUrl(notAll);
    //  one with Content-Type head, anotherOne is not
    // [Strange] attension or bug...
    // fixit.
    if(header){
      return T.parseContentType(header.value).mimeType;
    }else{
      return null;
    }
  }



  function initMimeTypeStore(){
    return {
      dict: {},
      add(url, responseHeaders) {
        if (state.redirectionStore.isTarget(url)
          || !T.isUrlHasFileExtension(url)
        ) {
          const mimeType = getMimeType(responseHeaders);
          if(mimeType){
            this.dict[url] = mimeType;
          }else{
            Log.warn("MimeType empty: ", url)
          }
        }
      }
    };
  }

  function initRedirectionStore() {
    const MIDDLE = 1, FINAL = 2;
    return {
      dict: {}, // url => targetUrl
      redirectStatus: {}, // targetUrl => status
      add(url, responseHeaders) {
        const header = T.getHeader(responseHeaders, 'location')
        if (header) {
          const targetUrl = header.value;
          this.dict[url] = targetUrl;
          this.redirectStatus[targetUrl] = FINAL;
          if (this.redirectStatus[url] === FINAL) {
            this.redirectStatus[url] = MIDDLE;
          }
        } else {
          // empty location
          Log.warn("Redirection (empty location): ", url);
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
      getFinalTarget(url) {
        const targetUrl = this.dict[url];
        if (targetUrl) {
          if (this.isFinalTarget(targetUrl)) {
            return targetUrl;
          } else {
            return this.getFinalTarget(targetUrl);
          }
        } else {
          return null;
        }
      },
      getRedirectionDict() {
        const r = {};
        for (let url in this.dict) {
          if (this.isMiddleTarget(url)) {
            // Do nothing
          } else {
            r[url] = this.getFinalTarget(url);
          }
        }
        return r;
      }
    }
  }

  function init() {
    state.mimeTypeStore = initMimeTypeStore();
    state.redirectionStore = initRedirectionStore();
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

  function getMimeTypeDict() {
    const mimeTypeDict = Object.assign({}, state.mimeTypeStore.dict);
    const redirectionDict = state.redirectionStore.getRedirectionDict();
    for (let url in redirectionDict) {
      const targetUrl = redirectionDict[url];
      mimeTypeDict[url] = mimeTypeDict[targetUrl];
    }
    return mimeTypeDict;
  }


  return {
    listen: listen,
    getMimeTypeDict: getMimeTypeDict,
    // test only
    init: init,
    emit: listener,
  }
})();


const StoreResource = (function() {

  function listen() {
    if (browser.webRequest.filterResponseData) {
      const filter = {
        urls: ["http://*/*", "https://*/*"],
        types: ["stylesheet", "image", "font" ]
      };

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
    browser.webRequest.onBeforeSendHeaders.removeListener(listener);
    browser.webRequest.onBeforeSendHeaders.addListener(
      listener,
      filter,
      ["blocking", "requestHeaders"]
    );
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
  StoreMimeType.listen();
  UnescapeHeader.listen();
  StoreResource.listen();
}

function getMimeTypeDict() {
  return StoreMimeType.getMimeTypeDict();
}



/*
 * @param {Object} global
 *   - {String} requestToken
 *   - {EventTarget} evTarget
 */
let Global = null;
function init(global) {
  Global = global;
}


const WebRequest = {
  init: init,
  listen: listen,
  getMimeTypeDict: getMimeTypeDict,
  // test only
  StoreMimeType: StoreMimeType,
  UnescapeHeader: UnescapeHeader,
}

export default WebRequest;
