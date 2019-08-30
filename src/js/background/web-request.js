;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/log.js'),
      require('../lib/tool.js'),
      require('../lib/ext-msg.js')
    );
  } else {
    // browser or other
    root.MxWcWebRequest = factory(
      root.MxWcLog,
      root.MxWcTool,
      root.MxWcExtMsg
    );
  }
})(this, function(Log, T, ExtMsg, undefined) {
  "use strict";

  const StoreMimeType = (function() {
    let state = {};

    function listener(details){
      if(details.type === 'xmlhttprequest'){
        handleXhr(details);
      }else{
        state.mimeTypeStore.add(details.url, details.responseHeaders);
      }
    }

    function handleXhr(details){
      // depends on statusLine's format. (could be dangerous)
      const strs = details.statusLine.split(" ");
      const httpVersion = strs.shift(),
            statusCode = strs.shift(),
            statusText = strs.join(" ");
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

    function getMimeTypeDict(response){
      response(state.mimeTypeStore.dict);
    }

    function getMimeType(headers){
      let match = T.detect(headers, function(header){
        // some server header name is lower case ... (fixit)
        return header.name.toLowerCase() === 'content-type';
      })
      // [firefox]
      //  will trigger two times sameUrl(notAll);
      //  one with Content-Type head, anotherOne is not
      // [Strange] attension or bug...
      // fixit.
      if(match){
        return match.value.split(';')[0];
      }else{
        return null;
      }
    }

    function initMimeTypeStore(){
      return {
        dict: {},
        add(url, responseHeaders) {
          if((new URL(url)).pathname.indexOf('.') == -1){
            const mimeType = getMimeType(responseHeaders);
            if(mimeType){
              this.dict[url] = mimeType;
            }else{
              Log.warn("MimeType empty: ", url)
            }
          }
        },
      };
    }

    function listen() {
      const filter = {
        urls: ["http://*/*", "https://*/*"],
        types: [
          "xmlhttprequest",
          "stylesheet",
          "image"
        ]
      };
      state.mimeTypeStore = initMimeTypeStore();
      browser.webRequest.onHeadersReceived.removeListener(listener);
      browser.webRequest.onHeadersReceived.addListener(
        listener,
        filter,
        ["responseHeaders"]
      );
    }

    return {
      listen: listen,
      getMimeTypeDict: getMimeTypeDict
    }
  })();



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
      details.requestHeaders.forEach((header) => {
        const originalName = unescapeName(header.name);
        if(originalName !== header.name) {
          header.name = originalName;
        }
      })
      return {requestHeaders: details.requestHeaders};
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

  function getMimeTypeDict(response) {
    return StoreMimeType.getMimeTypeDict(response);
  }


  return {
    listen: listen,
    getMimeTypeDict: getMimeTypeDict
  }
});
