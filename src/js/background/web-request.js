"use strict";

this.WebRequest = (function(){
  let state = {};
  const exports = {};

  function webRequestListener(details){
    if(details.type === 'xmlhttprequest'){
      handleXhr(details.responseHeaders);
    }else{
      state.mimeTypeStore.add(details.url, details.responseHeaders);
    }
  }

  function handleXhr(headers){
    const mimeType = getMimeType(headers)
    if(['text/html', 'text/plain'].indexOf(mimeType) > -1){
      ExtApi.sendMessageToContent({type: "page_content.changed"});
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


  function listen(){
    const filter = {
      urls: ["http://*/*", "https://*/*"],
      types: [
        "xmlhttprequest",
        "stylesheet",
        "image"
      ]
    };
    state.mimeTypeStore = initMimeTypeStore();
    browser.webRequest.onHeadersReceived.removeListener(webRequestListener);
    browser.webRequest.onHeadersReceived.addListener(
      webRequestListener,
      filter,
      ["responseHeaders"]
    );
  }
  exports.getMimeTypeDict = getMimeTypeDict;
  exports.listen = listen;
  return exports;
})();
