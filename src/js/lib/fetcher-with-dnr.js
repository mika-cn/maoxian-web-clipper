
/**
 * Forbidden headers can't be set using Fetch API :(
 * we use DeclarativeNetRequest API to set these headers
 */

import Fetcher from './fetcher.js';
import ExtApi  from './ext-api.js';
import fnv1a   from '../../vendor/fnv1a/index.js';


async function get(url, requestOptions = {}) {
  return await modifyHeadersWhenFetch('get', url, requestOptions);
}

async function head(url, requestOptions = {}) {
  return await modifyHeadersWhenFetch('head', url, requestOptions);
}


async function modifyHeadersWhenFetch(method, url, requestOptions) {
  const {newHeaders, dnrRule} = handleHeaders(url, requestOptions.headers);
  const newOptions = Object.assign({},
    requestOptions, {headers: newHeaders});
  if (!dnrRule) {
    return await Fetcher[method](url, newOptions);
  }


  let updatedDnrRule = false;
  try {
    const options = {removeRuleIds: [dnrRule.id], addRules: [dnrRule]};
    await ExtApi.updateDnrSessionRules(options);
    updatedDnrRule = true;
    // console.debug("set DNR session rule: ", dnrRule.id, url);
  } catch(e) {
    console.error("failed to update DNR session rules [before request]", e);
    // it's OK, we just can't modify these forbidden headers, in this case
  }

  let result, error;
  try {
    result = await Fetcher[method](url, newOptions)
  } catch(e) { error = e }

  if (updatedDnrRule) {
    try {
      const options = {removeRuleIds: [dnrRule.id]};
      await ExtApi.updateDnrSessionRules(options);
      // console.debug("remove DNR session rule: ", dnrRule.id, url);
    } catch(e) {
      console.error("failed to update DNR session rules [after request]", e);
      // It's OK, the next time we request the same url,
      // we'll remove it when add rule.
      // or it'll be removed when session ends.
    }
  }

  if (error) { throw error; }
  return result;
}


// forbidden headers that we want to modify
const FORBIDDEN_HEADERS = ['Referer', 'Origin'];

function handleHeaders(url, headers = {}) {
  const newHeaders = {};
  const requestHeaders = [];

  for (const name in headers) {
    const value = headers[name];

    if (FORBIDDEN_HEADERS.indexOf(name) == -1) {
      // normal headers, can be passed to fetch
      newHeaders[name] = value;
      continue;
    }

    const modifyInfo = {header: name};
    if (value == '$REMOVE_ME') { // see requestParams.js
      modifyInfo.operation = 'remove';
    } else {
      modifyInfo.operation = 'set';
      modifyInfo.value = value;
    }
    requestHeaders.push(modifyInfo);
  }

  let dnrRule = undefined;
  if (requestHeaders.length > 0) {
    dnrRule = {
      id: urlToRuleId(url),
      priority: 10,
      condition: { urlFilter: url },
      action: {
        type: 'modifyHeaders',
        requestHeaders,
      }
    };
  }

  return {newHeaders, dnrRule};
}


function urlToRuleId(url) {
  return Number(fnv1a(url, {size: 32}));
}

export default {get, head};
