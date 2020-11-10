
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
  const action = function() {
    return doGet(url, {respType, headers, timeout});
  };
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
  const cache = state.Cache.get(url);
  if (cache) {
    const resp = cache.readAsResponse();
    return resp[respType]();
  }
  const requestHeaders = appendToken(escapeHeaders(headers));

  return new Promise((resolve, reject) => {

    const xhr = new XMLHttpRequest();
    xhr.responseType = respType;
    xhr.timeout = timeout * 1000;

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

    const generateErrMsg = function(prefix, xhr, e) {
      const arr = [
        `[${prefix}]`, url,
        `readyState: ${xhr.readyState}`,
        `loaded: ${e.loaded}`,
      ];
      if (e.lengthComputable) {
        arr.push(`total: ${e.total}`);
      }
      return arr.join(', ');
    }


    // xhr.onloadstart = function(e) {
    // };

    // Progess event will be dispatched >= 1 times.
    // xhr.onprogress = function(e) {
    // };

    // After the last progress has been dispatched,
    // one of error, abort, timeout or load will be dispatched.


    // fires when there is a failure on the network level.
    xhr.onerror = function(e) {
      const msg = generateErrMsg('NetworkError', this, e);
      console.warn('mx-wc', msg);
      reject({message: msg, retry: true});
    };
    xhr.onabort = function(e) {
      const msg = generateErrMsg('Abort', this, e);
      console.warn('mx-wc', msg);
      reject({message: msg, retry: false});
    };
    xhr.ontimeout = function(e) {
      const msg = generateErrMsg('Timeout', this, e);
      console.warn('mx-wc', msg);
      reject({message: msg, retry: true});
    };
    xhr.onload = function(e) {
      if (this.status >= 200 && this.status < 300) {
        // 2xx
        resolve(this.response);
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

    xhr.open('GET', url);
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

export default {get, init};
