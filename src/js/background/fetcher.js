"use strict";

this.Fetcher = (function(){

  /*
   * @respType {string} text or blob
   * @url  {string} request url
   * @headers {object} http headers
   * @return {Promise} resolve with text or blob.
   */
  function get(respType, url, headers) {
    return new Promise((resolve, reject) => {
      // how to ensure mode is right
      fetch(url, {
        method: 'GET',
        headers: new Headers(escapeHeaders(headers)),
      }).then(
        (resp) => {
          if(resp.ok) {
            resp[respType]().then(resolve)
          } else {
            // An HTTP status of 404 does not constitute a network error.
            console.warn('mx-wc', url);
            console.warn('mx-wc', resp.status);
            console.warn('mx-wc', resp.statusText);
            console.warn('mx-wc', resp.headers);
          }
        },

        (e) => {
          // rejects with a TypeError when a network error is encountered, although this usually means a permissions issue or similar
          console.warn('mx-wc', url);
          console.error('mx-wc', e);
        }
      ).catch((e) => {
        // TypeError Since Firefox 43, fetch() will throw a TypeError if the URL has credentials
        console.warn('mx-wc', url);
        console.error('mx-wc', e);
      });
    });
  }

  function escapeHeaders(headers) {
    const forbidden = ['Referer', 'Origin'];
    const result = {};
    for(var name in headers) {
      if(forbidden.indexOf(name) > -1) {
        result["X-MxWc-" + name] = headers[name];
      } else {
        result[name] = headers[name];
      }
    }
    return result;
  }

  return {get: get}

})();
