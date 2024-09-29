
// TODO support more request options
// from @/en-US/docs/Web/API/RequestInit
class RequestParams {

  constructor({
    refUrl,
    userAgent,
    referrerPolicy = 'strict-origin-when-cross-origin',
    cache = 'default',
    credentials = 'same-origin',
    timeout = 40,
    tries = 3
  }) {
    this.refUrl = refUrl;
    this.userAgent = userAgent;
    this.referrerPolicy = referrerPolicy;
    this.cache = cache;
    this.credentials = credentials;
    this.timeout = timeout;
    this.tries = tries;
  }

  toObject() {
    return {
      refUrl         : this.refUrl,
      userAgent      : this.userAgent,
      referrerPolicy : this.referrerPolicy,
      cache          : this.cache,
      credentials    : this.credentials,
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
      url: url,
      headers: this.getHeaders(url),
      timeout: this.timeout,
      tries: this.tries,
      referrerPolicy: this.referrerPolicy,
      cache: this.cache,
      credentials: this.credentials,
    }
  }

  getHeaders(url) {
    // Although browser will automatically set User-Agent
    // but NativeApp won't.
    // NativeApp needs to fake itself as a browser so
    // that it won't be banned by server.
    //
    // TODO: removeMe
    // If we don't want to support old NativeApp, we can safely remove this.
    // Because the new NativeApp depends on browser to download asset files.
    const headers = { 'User-Agent' : this.userAgent };

    return headers;
  }
}

RequestParams.createExample = function(params = {}) {
  const {
    refUrl         = 'https://example.org',
    userAgent      = 'UserAgent',
    referrerPolicy = 'origin',
    cache          = 'default',
    credentials    = 'strict-origin-when-cross-origin',
    timeout        = 40,
    tries          = 3
  } = params;
  return new RequestParams({refUrl, userAgent, referrerPolicy, cache, credentials, timeout, tries});
}

export default RequestParams;
