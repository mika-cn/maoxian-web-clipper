
const _ = {};
  /*
   * @param {String} policy - referrer-policy
   */
_.getRefererHeader = function(refUrl, targetUrl, policy) {

  switch (policy) {
    case 'no-referrer':
      return null;

    case 'no-referrer-when-downgrade':
      if (_.isDowngradeRequest(refUrl, targetUrl)) {
        return null;
      }
      break;

    case 'origin':
      return (new URL(refUrl)).origin;

    case 'origin-when-cross-origin':
      if (_.isCrossOriginRequest(refUrl, targetUrl)) {
        return (new URL(refUrl)).origin;
      }
      break;

    case 'same-origin':
      if (_.isCrossOriginRequest(refUrl, targetUrl)) {
        return null;
      }
      break;

    case 'strict-origin':
      if (_.isDowngradeRequest(refUrl, targetUrl)) {
        return null;
      }
      return (new URL(refUrl)).origin;

    case 'strict-origin-when-cross-origin':
      if (!_.isCrossOriginRequest(refUrl, targetUrl)) {
        break;
      }
      if (_.isSameSecureLevelRequest(refUrl, targetUrl)) {
        return (new URL(refUrl)).origin;
      }
      if (_.isDowngradeRequest(refUrl, targetUrl)) {
        return null;
      } else {
        // FIXME
        return (new URL(refUrl)).origin;
      }

    case 'unsafe-url':
    default: break;
  }

  // strip sensitive infos
  // use rest parts(origin, path, and search) as Referer
  const it = new URL(refUrl);
  it.username = '';
  it.password = '';
  it.hash = '';
  return it.href;
}


_.getOriginHeader = function(refUrl, targetUrl) {
  if (_.isDowngradeRequest(refUrl, targetUrl)) {
    // not origin when downgrade request
    return null;
  }
  const u = new URL(refUrl);
  const t = new URL(targetUrl);
  return u.origin === t.origin ? null : u.origin;
}

_.isCrossOriginRequest = function(refUrl, targetUrl) {
  const u = new URL(refUrl);
  const t = new URL(targetUrl);
  return u.origin !== t.origin;
}

_.getCookieHeader = function(refUrl, targetUrl, credentials) {
  if (credentials && credentials == 'same-origin') {
    return "$SAME_ORIGIN";
  } else {
    return null;
  }
}

_.isSameSecureLevelRequest = function(refUrl, targetUrl) {
  return (
       _.isHttps(refUrl) && _.isHttps(targetUrl)
    || _.isHttp(refUrl) && _.isHttp(targetUrl)
  );
}

_.isDowngradeRequest = function(refUrl, targetUrl) {
  return _.isHttps(refUrl) && _.isHttp(targetUrl);
}

_.isHttps = function(url) {
  return url.match(/^https:/i);
}

_.isHttp = function(url) {
  return url.match(/^http:/i);
}


export default _;
