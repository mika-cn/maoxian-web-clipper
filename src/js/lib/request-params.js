
class RequestParams {

  constructor({sessionId, refUrl, userAgent, referrerPolicy, timeout = 40, tries = 3}) {
    this.sessionId = sessionId;
    this.refUrl = refUrl;
    this.userAgent = userAgent;
    this.referrerPolicy = referrerPolicy;
    this.timeout = timeout;
    this.tries = tries;
  }

  toObject() {
    return {
      sessionId      : this.sessionId,
      refUrl         : this.refUrl,
      userAgent      : this.userAgent,
      referrerPolicy : this.referrerPolicy,
      timeout        : this.timeout,
      tries          : this.tries,
    }
  }

  // return a new RequestParams
  changeRefUrl(refUrl) {
    const obj = this.toObject();
    return new RequestParams(
      Object.assign({}, obj, {refUrl})
    );
  }

  toParams(url) {
    return {
      sessionId: this.sessionId,
      url: url,
      headers: this.getHeaders(url),
      timeout: this.timeout,
      tries: this.tries,
    }
  }

  getHeaders(url) {
    // Although browser will automatically set User-Agent
    // but NativeApp won't.
    // NativeApp needs to fake itself as a browser so
    // that it won't be banned by server.
    const headers = { 'User-Agent' : this.userAgent };

    const referer = this.getReferrerHeader(
      this.refUrl, url,
      this.referrerPolicy
    );

    // $REMOVE_ME ? (see web-request.js for more details)

    if (referer) {
      headers['Referer'] = referer;
    } else {
      headers['Referer'] = '$REMOVE_ME';
    }

    const origin = this.getOriginHeader(this.refUrl, url);
    if (origin) {
      headers['Origin'] = origin;
    } else {
      headers['Origin'] = '$REMOVE_ME';
    }

    return headers;
  }


  /*
   * @param {String} policy - see <img>'s attribute referrerpolicy for details.
   */
  getReferrerHeader(refUrl, targetUrl, policy) {
    if (this.isDowngradeHttpRequest(refUrl, targetUrl)) {
      // no-referrer-when-downgrade
      return null;
    }
    switch (policy) {
      case 'originWhenCrossOrigin':
        const u = new URL(refUrl);
        const t = new URL(targetUrl);
        if (u.origin !== t.origin) {
          return u.origin;
        } else {
          break;
        }
      case 'origin':
        return (new URL(refUrl)).origin;
      case 'noReferrer':
        return null;
      case 'unsafeUrl':
      default: break;
    }

    if (refUrl.indexOf('#') > 0) {
      return refUrl.split('#')[0];
    } else {
      return refUrl;
    }
  }

  getOriginHeader(refUrl, targetUrl) {
    if (this.isDowngradeHttpRequest(refUrl, targetUrl)) {
      // not origin when downgrade request
      return null;
    }
    const u = new URL(refUrl);
    const t = new URL(targetUrl);
    return u.origin === t.origin ? null : u.origin;
  }

  isDowngradeHttpRequest(fromUrl, toUrl) {
    return fromUrl.match(/^https:/i) && toUrl.match(/^http:/i)
  }

}

RequestParams.createExample = function(params = {}) {
  const {
    sessionId      = '001',
    refUrl         = 'https://example.org',
    userAgent      = 'UserAgent',
    referrerPolicy = 'origin',
    timeout        = 40,
    tries          = 3
  } = params;
  return new RequestParams({sessionId, refUrl, userAgent, referrerPolicy, timeout, tries});
}

export default RequestParams;
