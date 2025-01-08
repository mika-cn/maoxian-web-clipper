
import H from '../helper.js'
import HttpUtils from '../../src/js/lib/http-utils.js';


describe('HttpUtils.getRefererHeader', () => {

  function fromHttpsUrl() {
    const refUrl  = "https://foo.org/page#anchor";
    const allPath = 'https://foo.org/page';
    const origin  = 'https://foo.org';

    const sameOrigin = {
      refUrl,
      targetUrl: 'https://foo.org/other-page',
      allPath,
      origin
    };

    const crossOriginDiffHost = {
      refUrl,
      targetUrl: 'https://bar.org/page',
      allPath,
      origin,
    };

    const crossOriginDiffScheme = {
      refUrl,
      targetUrl: 'http://foo.org/other-page',
      allPath,
      origin,
    };

    const crossOriginDiffAll = {
      refUrl,
      targetUrl: 'http://bar.org/page',
      allPath,
      origin,
    };

    return {
      sameOrigin,
      crossOriginDiffHost,
      crossOriginDiffScheme,
      crossOriginDiffAll,
    }
  }

  function fromHttpUrl() {
    const refUrl  = "http://foo.org/page#anchor";
    const allPath = 'http://foo.org/page';
    const origin  = 'http://foo.org';

    const sameOrigin = {
      refUrl,
      targetUrl: 'http://foo.org/other-page',
      allPath,
      origin,
    };

    const crossOriginDiffHost = {
      refUrl,
      targetUrl: 'http://bar.org/page',
      allPath,
      origin,
    };

    const crossOriginDiffScheme = {
      refUrl,
      targetUrl: 'https://foo.org/other-page',
      allPath,
      origin,
    };

    const crossOriginDiffAll = {
      refUrl,
      targetUrl: 'https://bar.org/page',
      allPath,
      origin,
    };

    return {
      sameOrigin,
      crossOriginDiffHost,
      crossOriginDiffScheme,
      crossOriginDiffAll,
    }
  }

  function test(params, policy, expectedValue) {
    const {refUrl, targetUrl} = params;
    const value = HttpUtils.getRefererHeader(
      refUrl, targetUrl, policy);
    H.assertEqual(value, expectedValue)
  }


  it('policy: no-referrer', () => {
    const policy = 'no-referrer'
    const objA = fromHttpsUrl();
    const objB = fromHttpUrl();

    [
      objA.sameOrigin,
      objA.crossOriginDiffHost,
      objA.crossOriginDiffScheme,
      objA.crossOriginDiffAll,
      objB.sameOrigin,
      objB.crossOriginDiffHost,
      objB.crossOriginDiffScheme,
      objB.crossOriginDiffAll,
    ].forEach((params) => {
      test(params, policy, null);
    });
  });



  it('policy: no-referrer-when-downgrade', () => {
    const policy = 'no-referrer-when-downgrade'
    const objA = fromHttpsUrl();
    const objB = fromHttpUrl();

    [
      objA.crossOriginDiffScheme, // HTTPS -> HTTP (downgrade)
      objA.crossOriginDiffAll,    // HTTPS -> HTTP (downgrade)
    ].forEach((params) => {
      test(params, policy, null);
    });

    [
      objA.sameOrigin,
      objA.crossOriginDiffHost,
      objB.sameOrigin,
      objB.crossOriginDiffHost,
      objB.crossOriginDiffScheme,
      objB.crossOriginDiffAll,
    ].forEach((params) => {
      test(params, policy, params.allPath);
    });

  });


  it('policy: origin', () => {
    const policy = 'origin'
    const objA = fromHttpsUrl();
    const objB = fromHttpUrl();

    [
      objA.sameOrigin,
      objA.crossOriginDiffHost,
      objA.crossOriginDiffScheme,
      objA.crossOriginDiffAll,
      objB.sameOrigin,
      objB.crossOriginDiffHost,
      objB.crossOriginDiffScheme,
      objB.crossOriginDiffAll,
    ].forEach((params) => {
      test(params, policy, params.origin);
    });

  });



  it('policy: origin-when-cross-origin', () => {
    const policy = 'origin-when-cross-origin';
    const objA = fromHttpsUrl();
    const objB = fromHttpUrl();

    [
      objA.sameOrigin, // HTTPS -> HTTPS
      objB.sameOrigin, // HTTP  -> HTTP
    ].forEach((params) => {
      test(params, policy, params.allPath);
    });


    [
      objA.crossOriginDiffHost,
      objA.crossOriginDiffScheme,
      objA.crossOriginDiffAll,
      objB.crossOriginDiffHost,
      objB.crossOriginDiffScheme,
      objB.crossOriginDiffAll,
    ].forEach((params) => {
      test(params, policy, params.origin);
    });
  });


  it('policy: same-origin', () => {
    const policy = 'same-origin';
    const objA = fromHttpsUrl();
    const objB = fromHttpUrl();

    [
      objA.sameOrigin, // HTTPS -> HTTPS
      objB.sameOrigin, // HTTP  -> HTTP
    ].forEach((params) => {
      test(params, policy, params.allPath);
    });


    [
      objA.crossOriginDiffHost,
      objA.crossOriginDiffScheme,
      objA.crossOriginDiffAll,
      objB.crossOriginDiffHost,
      objB.crossOriginDiffScheme,
      objB.crossOriginDiffAll,
    ].forEach((params) => {
      test(params, policy, null);
    });
  });


  it('policy: strict-origin', () => {
    const policy = 'strict-origin';
    const objA = fromHttpsUrl();
    const objB = fromHttpUrl();

    [
      objA.crossOriginDiffScheme, // HTTPS -> HTTP
      objA.crossOriginDiffAll,    // HTTPS -> HTTP
    ].forEach((params) => {
      test(params, policy, null);
    });

    [
      objA.sameOrigin,
      objA.crossOriginDiffHost,
      objB.sameOrigin,
      objB.crossOriginDiffHost,
      objB.crossOriginDiffScheme,
      objB.crossOriginDiffAll,
    ].forEach((params) => {
      test(params, policy, params.origin);
    });

  });


  it('policy: strict-origin-when-cross-origin', () => {
    const policy = 'strict-origin-when-cross-origin';
    const objA = fromHttpsUrl();
    const objB = fromHttpUrl();

    // same-origin request
    [
      objA.sameOrigin,
      objB.sameOrigin,
    ].forEach((params) => {
      test(params, policy, params.allPath);
    });

    // protocol secure level stays same
    [
      objA.crossOriginDiffHost,
      objB.crossOriginDiffHost,
    ].forEach((params) => {
      test(params, policy, params.origin);
    });


    // less secure destinations
    [
      objA.crossOriginDiffScheme, // HTTPS -> HTTP
      objA.crossOriginDiffAll,    // HTTPS -> HTTP
    ].forEach((params) => {
      test(params, policy, null);
    });

    // objB.crossOriginDiffScheme, // HTTP -> HTTPS ?
    // objB.crossOriginDiffAll,    // HTTP -> HTTPS ?
  });



  it('policy: unsafe-url', () => {
    const policy = 'unsafe-url'
    const objA = fromHttpsUrl();
    const objB = fromHttpUrl();
    [
      objA.sameOrigin,
      objA.crossOriginDiffHost,
      objA.crossOriginDiffScheme,
      objA.crossOriginDiffAll,
      objB.sameOrigin,
      objB.crossOriginDiffHost,
      objB.crossOriginDiffScheme,
      objB.crossOriginDiffAll,
    ].forEach((params) => {
      test(params, policy, params.allPath);
    });
  });

});
