;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/log.js'),
      require('../lib/tool.js'),
      require('../lib/ext-msg.js'),
      require('./bg-env.js')
    );
  } else {
    // browser or other
    root.MxWcWebRequest = factory(
      root.MxWcLog,
      root.MxWcTool,
      root.MxWcExtMsg,
      root.MxWcBgEnv
    );
  }
})(this, function(Log, T, ExtMsg, BgEnv, undefined) {
  "use strict";

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
      const header = getHeader(headers, 'content-type');
      // [firefox]
      //  will trigger two times sameUrl(notAll);
      //  one with Content-Type head, anotherOne is not
      // [Strange] attension or bug...
      // fixit.
      if(header){
        return header.value.split(';')[0];
      }else{
        return null;
      }
    }

    // WARNING: name should be lowercase
    function getHeader(headers, name) {
      return [].find.call(headers, function(header){
        // some server's header name is lower case ... (fixit)
        return header.name.toLowerCase() === name;
      })
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
          const header = getHeader(responseHeaders, 'location')
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
        const headers = [];
        details.requestHeaders.forEach((header) => {
          if (header.name !== 'X-MxWc-Token') {
            const originalName = unescapeName(header.name);
            headers.push({name: originalName, value: header.value});
          }
        })
        return {requestHeaders: headers};
      } else {
        return {requestHeaders: details.requestHeaders};
      }
    }

    function isSentByUs(requestHeaders) {
      return T.any(requestHeaders, (header) => {
        return (header.name === 'X-MxWc-Token'
          && header.value === BgEnv.requestToken);
      })
    }

    function unescapeName(name) {
      const regex = /^X-MxWc-/i;
      if(name.match(regex)) {
        const r = name.replace(regex, '');
        // capitalize
        const originalName = r.split('-').map((it) => {
          return [
            it.substring(0, 1).toUpperCase(),
            it.substring(1, it.length)
          ].join('')
        }).join('-');
        const whiteList = ['Referer', 'Origin'];
        if(whiteList.indexOf(originalName) > -1) {
          return originalName;
        } else {
          return name;
        }
      } else {
        return name;
      }
    }

    return {
      listen: listen
    }
  })();

  function listen() {
    StoreMimeType.listen();
    UnescapeHeader.listen();
  }

  function getMimeTypeDict() {
    return StoreMimeType.getMimeTypeDict();
  }


  return {
    listen: listen,
    getMimeTypeDict: getMimeTypeDict,
    // test only
    StoreMimeType: StoreMimeType,
  }
});
