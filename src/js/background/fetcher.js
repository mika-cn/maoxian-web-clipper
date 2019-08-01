;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcFetcher', [], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcFetcher = factory();
  }
})(this, function(undefined) {
  "use strict";

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
            const msg = [url, resp.status, resp.statusText].join(', ');
            console.warn('mx-wc', msg);
            console.warn('mx-wc', resp.headers);
            reject(msg);
          }
        },

        (e) => {
          // rejects with a TypeError when a network error is encountered, although this usually means a permissions issue or similar
          const msg = [url, e.message].join(', ');
          console.warn('mx-wc', msg);
          console.error('mx-wc', e);
          reject(msg);
        }
      ).catch((e) => {
        // TypeError Since Firefox 43, fetch() will throw a TypeError if the URL has credentials
        const msg = [url, e.message].join(', ');
        console.warn('mx-wc', url);
        console.error('mx-wc', e);
        reject(msg);
      });
    });
  }

  // see js/background/web-request.js UnescapeHeader for more details.
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

});
