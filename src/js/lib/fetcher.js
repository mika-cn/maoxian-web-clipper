"use strict";

import T from './tool.js';

// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

/*
 * @see doGet()
 * @param {integer} tries - How many times we'll try (default 3)
 */
function get(url, {respType = 'text', headers = {}, timeout = 40, tries = 3}) {
  const action = function() { return doGet(url, {respType, headers, timeout}) };
  return T.retryAction(action, tries);
}

/*
 * @see doHead()
 * @param {integer} tries - How many times we'll try (default 3)
 */
function head(url, {headers = {}, timeout = 40, tries = 3}) {
  const action = function() { return doHead(url, {headers, timeout}) };
  return T.retryAction(action, tries);
}

/*
 * @param {String} url request url
 * @param {Object} options
 *   - {String} respType "text" or "blob"
 *   - {Object} headers http headers
 *   - {Integer} timeout (seconds)
 *
 * @return {Promise} resolve with text or blob.
 */
function doGet(url, {respType = 'text', headers = {}, timeout = 40}) {
  return new Promise((resolve, reject) => {
    const cache = state.Cache.get(url);
    if (cache) {
      const resp = cache.readAsResponse();
      return resp[respType]().then(resolve);
    } else {
      doFetch('GET', url, {headers, timeout}).then((resp) => {
        resp[respType]().then(resolve);
      }, reject);
    }
  });
}


/*
 * @param {String} url request url
 * @param {Object} options
 *   - {Object} headers http headers
 *   - {Integer} timeout (seconds)
 *
 * @return {Promise} requesting : resolve with headers
 */
function doHead(url, {headers = {}, timeout = 40}) {
  return new Promise((resolve, reject) => {
    const cache = state.Cache.get(url);
    if (cache) {
      const resp = cache.readAsResponse({headersOnly: true});
      resolve(resp.headers);
    } else {
      doFetch('HEAD', url, {headers, timeout}).then((resp) => {
        resolve(resp.headers);
      }, reject);
    }
    return
  });
}


function doFetchWithTimeout(method, url, {headers, timeout=40}) {

  return new Promise((resolve, reject) => {
    const {extraFetchOpts, timeoutPromise} = getTimeoutParams(timeout);

    // FIXME
    // add referrerPolicy to here instead of do it ourself.
    // do we need credentials option here?
    // how to ensure mode is right
    //
    // Because we can't block web request in manifest V3
    // We couldn't edit these restricted headers and add request token here
    // can we avoid it?
    const options = Object.assign(extraFetchOpts, {
      method: method,
      headers: new Headers(appendToken(escapeHeaders(headers))),
      redirect: 'follow',
    });

    Promise.race([ fetch(url, options), timeoutPromise ]).then(
      (resp) => {
        if(resp.ok) {
          resolve(resp);
        } else {
          // An HTTP status of 404 does not constitute a network error.
          const msg = [url, resp.status, resp.statusText].join(', ');
          console.warn('mx-wc', msg);
          console.warn('mx-wc', resp.headers);
          reject({message: msg, retry: false}
        }
      },

      (e) => {
        // rejects with a TypeError when a network error is encountered, although this usually means a permissions issue or similar
        const arr = [url, e.message];
        if (e.message.match(/aborted/i) || e.message.match(/timeout/i)) {
          // aborted by us
          arr.push("Timeout")
          const msg = arr.join(", ");
          console.warn('mx-wc', msg);
          console.error('mx-wc', e);
          reject({message: msg, retry: true});
        } else {
          const msg = arr.join(", ");
          console.warn('mx-wc', msg);
          console.error('mx-wc', e);
          reject({message: msg, retry: false});
        }
      }
    ).catch((e) => {
      // TypeError Since Firefox 43, fetch() will throw a TypeError if the URL has credentials
      const msg = [url, e.message].join(', ');
      console.warn('mx-wc', msg);
      console.error('mx-wc', e);
      reject({message: msg, retry: false});
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
    // FIXME delete this try catch, because we can't support old browser anymore
    // if we upgrade to manifest V3
    console.debug("AbortController is not supported");
    timeoutPromise = new Promise((_, reject) => {
      setTimeout(reject, delay * 1000, new Error("timeout"));
    });
  }
  return {extraFetchOpts, timeoutPromise};
}


// Forbidden header name (cannot be modified programmatically)
// see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name.html
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

function appendToken(headers) {
  return Object.assign({"X-MxWc-Token": state.requestToken}, headers)
}

// We should set request token first.
const state = {};
function init({token, cache}) {
  state.requestToken = token;
  state.Cache = cache
}

export default {init, get, head};
