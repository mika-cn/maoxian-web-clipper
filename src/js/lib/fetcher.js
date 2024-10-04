"use strict";

import T from './tool.js';

// https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch


// How many times we'll try (default 3)
const TRIES = 3;

/*
 * @see doGet()
 * @param {integer} requestOptions.tries - Times to try
 */
function get(url, requestOptions = {}) {
  const tries = T.deleteObjAttr(requestOptions, 'tries', TRIES);
  const action = function() { return doGet(url, requestOptions) };
  return T.retryAction(action, tries);
}

/*
 * @see doHead()
 * @param {integer} requestOptions.tries - Times to try
 */
function head(url, requestOptions = {}) {
  const tries = T.deleteObjAttr(requestOptions, 'tries', TRIES);

  const action = function() { return doHead(url, requestOptions) };
  return T.retryAction(action, tries);
}


/*
 * @param {String} url request url
 * @param {String} requestOptions.respType -  "text" or "blob"
 *
 * @returns {Promise} resolve with text or blob.
 */
function doGet(url, requestOptions = {}) {
  const {respType = 'text'} = requestOptions;
  return new Promise((resolve, reject) => {
    doFetch('GET', url, requestOptions).then((resp) => {
      resp[respType]().then(resolve, reject);
    }, reject);
  });
}


/*
 * @param {String} url request url
 * @param {Object} requestOptions
 * @returns {Promise} requesting : resolve with headers
 */
function doHead(url, requestOptions = {}) {
  return new Promise((resolve, reject) => {
    doFetch('HEAD', url, requestOptions).then((resp) => {
      resolve(resp.headers);
    }, reject);
  });
}


/*
 * @see @mdn/en-US/docs/Web/API/Fetch_API/Using_Fetch
 * @see @mdn/en-US/docs/Web/API/Window/fetch
 * @see @mdn/en-US/docs/Web/API/RequestInit
 */
function doFetch(method, url, {
  headers = {},
  timeout = 40,
  cache = 'default',
  credentials = 'same-origin',
  referrerPolicy = 'strict-origin-when-cross-origin',
  referrer = 'about:client',
  mode = 'cors',
  redirect = 'follow',
}) {

  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const options = {
      method, headers : new Headers(headers),
      redirect, mode, cache,
      credentials, referrerPolicy,
      signal: controller.signal,
    }

    let requestAborted = false;
    const timeoutId = setTimeout(() => {
      try {
        controller.abort();
        console.debug("timeout (natually), abort the fetch request", url);
        setTimeout(() => {
          // If the requst is not aborted, reject the promise
          if (!requestAborted) {
            const message = ["Timeout abort failed", url].join(', ');
            reject({message, retry: false});
          }
        }, 1000);
      } catch (e) {
        console.debug("timeout (catch), when fetch request", url);
      }
    }, timeout * 1000);


    fetch(url, options).then(
      (resp) => {
        clearTimeout(timeoutId);
        if(resp.ok) {
          resolve(resp);
        } else {
          // An HTTP status of 404 does not constitute a network error.
          const msg = [url, resp.status, resp.statusText].join(', ');
          console.warn('mx.request failed : ', msg);
          console.warn('mx.request failed : ', resp.headers);
          reject({message: msg, retry: false});
        }
      },
      (e) => {
        // rejects with a TypeError when a network error is encountered,
        // although this usually means a permissions issue or similar
        const arr = [url, e.message];
        if (e.message.match(/aborted/i) || e.message.match(/timeout/i)) {
          requestAborted = true;
          // aborted by us
          arr.push("Timeout")
          const msg = arr.join(", ");
          console.warn('mx-wc', msg);
          console.error('mx-wc', e);
          reject({message: msg, retry: true});
        } else {
          clearTimeout(timeoutId);
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


export default {get, head};
