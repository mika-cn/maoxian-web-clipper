
import T from './tool.js';

/*
 * Because the global fetch() function hasn't provided a timeout option
 * And the `AbortController`(to provide timeout) is not that reliable yet.
 *
 * We use the old XHR which supports timeout and could give us more control.
 */

/*
 * References:
 * - https://xhr.spec.whatwg.org/ (living standard)
 * - https://www.w3.org/TR/2014/WD-XMLHttpRequest-20140130 (previous standard)
 */

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

/**
 * @param {String} url request url
 * @param {Object} options (@see doXhr)
 *
 * @return {Promise} requesting : resolve with text or blob.
 */
function doGet(url, {respType = 'text', headers = {}, timeout = 40}) {
  return new Promise((resolve, reject) => {
    const cache = state.Cache.get(url);
    if (cache) {
      const resp = cache.readAsResponse();
      resp[respType]().then(resolve);
    } else {
      doXhr('GET', url, {respType, headers, timeout}).then((resp) => {
        resp[respType]().then(resolve);
      }, reject);
    }
  });
}

/**
 * @param {String} url request url
 * @param {Object} options (@see doXhr)
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
      doXhr('HEAD', url, {headers, timeout}).then((resp) => {
        resolve(resp.headers);
      }, reject);
    }
    return
  });
}

/**
 * @param {String} method : 'GET' or 'HEAD'.
 * @param {String} url request url
 * @param {Object} options
 *   - {Object} headers request headers
 *   - {Integer} timeout (seconds)
 *
 * @return {Promise} resolve with a Response object.
 *
 */
function doXhr(method, url, {headers = {}, timeout = 40}) {

  const requestHeaders = appendToken(escapeHeaders(headers));

  return new Promise((resolve, reject) => {

    const xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.timeout = timeout * 1000;
    xhr.__loadedBytes = -1;
    xhr.__totalBytes = -1;

    //
    // Ready State:
    //
    //   name          value  description
    // ----------------------------------------------------------
    //  UNSET            0    The object has been constructed.
    //  OPENED           1    The open() method has been successfully invoked.
    //  HEADERS_RECEIVED 2    All redirects (if any) have been followed and all response headers have been received.
    //  LOADING          3    The response’s body is being received.
    //  DONE             4    The data transfer has been completed or something went wrong during the transfer (e.g. infinite redirects).
    //

    // xhr.onreadystatechange = function(e) {
    //   this.readyState
    // };



    //
    // Progress Event Object:
    //
    //     attr              initValue   description
    //------------------------------------------------------------------
    //    loaded             0           How many bytes has loaded.
    //    lengthComputable   false       If server send a Content-Length header, then it's true.
    //    total              0           How many bytes total, Don't use it if lengthComputable is false.
    //

    const generateErrMsg = function(prefix, xhr) {
      const arr = [
        `[${prefix}]`, url,
        `readyState: ${xhr.readyState}`,
      ];
      if (xhr.__loadedBytes > -1) {
        arr.push(`loaded: ${xhr.__loadedBytes}`);
      }
      if (xhr.__totalBytes > -1) {
        arr.push(`total: ${xhr.__totalBytes}`);
      }
      return arr.join(', ');
    }


    // xhr.onloadstart = function(e) {
    // };

    // Progess event will be dispatched >= 1 times.
    xhr.onprogress = function(e) {
      if (e.loaded && e.loaded > this.__loadedBytes) {
        this.__loadedBytes = e.loaded;
      }
      if (e.lengthComputable && e.total && e.total > this.__totalBytes) {
        this.__totalBytes = e.total;
      }
    };

    // After the last progress has been dispatched,
    // one of error, abort, timeout or load will be dispatched.


    // fires when there is a failure on the network level.
    xhr.onerror = function(e) {
      const msg = generateErrMsg('NetworkError', this);
      console.warn('mx-wc', msg);
      reject({message: msg, retry: true});
    };
    xhr.onabort = function(e) {
      const msg = generateErrMsg('Abort', this);
      console.warn('mx-wc', msg);
      reject({message: msg, retry: false});
    };
    xhr.ontimeout = function(e) {
      const msg = generateErrMsg('Timeout', this);
      console.warn('mx-wc', msg);
      reject({message: msg, retry: true});
    };
    xhr.onload = function(e) {
      if (this.status >= 200 && this.status < 300) {
        // 2xx
        const body = this.response;
        const respHeaders = T.headerText2HeadersObj(this.getAllResponseHeaders())
        const init = {status: this.status, statusText: this.statusText, headers: respHeaders};
        resolve(new Response(body, init));
      } else {
        // XMLHttpRequest handles redirects automatically in the background,
        // So We don't need to handle it.
        //
        // 404 or others
        const msg = [url, this.status, this.statusText].join(', ');
        console.warn('mx-wc', msg);
        reject({message: msg, retry: false});
      }
    };

    //xhr.onloadend = function(e) {
    //  // After one of error, abort, timeout or load has been dispatched.
    //};

    xhr.open(method, url);
    for (let name in requestHeaders) {
      xhr.setRequestHeader(name, requestHeaders[name]);
    }
    xhr.send();

  });
}


// Forbidden header name (cannot be modified programmatically)
// see https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_header_name.html
// see js/background/web-request.js UnescapeHeader for more details.
function escapeHeaders(headers) {
  const forbidden = ['Referer', 'Origin'];
  // Why chromium complain "Refused to set unsafe header "User-Agent"?
  forbidden.push('User-Agent');
  const result = {};
  for(let name in headers) {
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
  state.Cache = cache;
}

export default {init, get, head};
