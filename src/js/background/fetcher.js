;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcFetcher = factory();
  }
})(this, function(undefined) {
  "use strict";

  /*
   * @param {String} url request url
   * @param {Object} options
   *   - {String} respType "text" or "blob"
   *   - {Object} headers http headers
   *   - {Integer} timeout (seconds)
   *
   * @return {Promise} resolve with text or blob.
   */
  function get(url, {respType = 'text', headers, timeout = 40}) {
    return new Promise((resolve, reject) => {
      // how to ensure mode is right
      const {extraFetchOpts, timeoutPromise} = getTimeoutParams(timeout);
      const options = Object.assign(extraFetchOpts, {
        method: 'GET',
        headers: new Headers(escapeHeaders(headers)),
      });

      Promise.race([ fetch(url, options), timeoutPromise ]).then(
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
          const arr = [url, e.message];
          if (e.message.match(/aborted/i)) {
            // aborted by us
            arr.push("Timeout")
          }
          const msg = arr.join(", ");
          console.warn('mx-wc', msg);
          console.error('mx-wc', e);
          reject(msg);
        }
      ).catch((e) => {
        // TypeError Since Firefox 43, fetch() will throw a TypeError if the URL has credentials
        const msg = [url, e.message].join(', ');
        console.warn('mx-wc', msg);
        console.error('mx-wc', e);
        reject(msg);
      });
    });
  }

  /**
   * FIXME fetch don't support timeout option. (maybe it'll be supported in the future)
   * @param {Integer} delay (seconds)
   */
  function getTimeoutParams(delay) {
    let timeoutPromise;
    const extraFetchOpts = {};
    try {
      // AbortController is an experimental technology.
      // Firefox Full support (since 57)
      // Chrome Full support (since 66)
      const controller = new AbortController();
      extraFetchOpts.signal = controller.signal;
      timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          try {
            controller.abort();
            reject(new Error("timeout (natually)"));
          } catch (e) {
            // real evil network environment
            reject(new Error("timeout (catch)"));
          }
        }, delay * 1000);
      });
    } catch(e) {
      timeoutPromise = new Promise((_, reject) => {
        setTimeout(reject, delay * 1000, new Error("Timeout"));
      });
    }
    return {extraFetchOpts, timeoutPromise};
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
