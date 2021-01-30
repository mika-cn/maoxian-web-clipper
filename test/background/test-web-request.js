import H from '../helper.js';
import WebRequest from '../../src/js/background/web-request.js';

const REQUEST_TOKEN = 'abcd';
WebRequest.init({requestToken: REQUEST_TOKEN});


describe('WebRequest', () => {

  function getRedirectionEvDetails(resourceType, url, targetUrl) {
    return {
      type: resourceType,
      url: url,
      redirectUrl: targetUrl,
    }
  }

  describe('StoreRedirection', () => {

    it('should store redirection', () => {
      const {StoreRedirection} = WebRequest;
      StoreRedirection.init();
      const originalUrl = 'http://a.org/image';
      const targetUrl = 'https://a.org/image.jpg';

      const evDetails = getRedirectionEvDetails('image', originalUrl, targetUrl);
      StoreRedirection.perform(evDetails);

      const dict = StoreRedirection.getRedirectionDict();
      H.assertEqual(dict[originalUrl], targetUrl);
    });

    it('should store redirection that has multiply hops', () => {
      const {StoreRedirection} = WebRequest;
      StoreRedirection.init();
      const originalUrl = 'http://a.org/origin';
      const middleUrl = 'https://a.org/middle';
      const targetUrl = 'https://a.org/final';

      const evDetailsA = getRedirectionEvDetails('sub_frame', originalUrl, middleUrl);
      const evDetailsB = getRedirectionEvDetails('sub_frame', middleUrl, targetUrl);

      StoreRedirection.perform(evDetailsA);
      StoreRedirection.perform(evDetailsB);

      const dict = StoreRedirection.getRedirectionDict();
      H.assertEqual(dict[originalUrl], targetUrl);
    });

  });

  describe('StoreMimeType', () => {

    it('should store mimeType if request url has not file extension', () => {
      const {StoreMimeType} = WebRequest;
      StoreMimeType.init();
      const url = 'https://a.org/image';
      const details = getDetails('200', url,
        {'Content-Type': 'image/png'}
      );
      StoreMimeType.emit(details);
      const v = StoreMimeType.getMimeType(url);
      H.assertEqual(v, 'image/png');
    });


    it('should store mimeType if request url is a redirection target', () => {

      // perform redirection
      const {StoreMimeType, StoreRedirection} = WebRequest;
      StoreRedirection.init();
      const originalUrl = 'http://a.org/image';
      const targetUrl = 'https://a.org/image.jpg';

      const evDetails = getRedirectionEvDetails('image', originalUrl, targetUrl);
      StoreRedirection.perform(evDetails);


      StoreMimeType.init();
      const details = getDetails('200', targetUrl,
        {'Content-Type': 'image/png'}
      );
      StoreMimeType.emit(details);
      const v = StoreMimeType.getMimeType(originalUrl);
      H.assertEqual(v, 'image/png');

    });


    function getDetails(statusCode, requestUrl, headers) {
      const responseHeaders = [];
      for(let key in headers) {
        responseHeaders.push({
          name: key,
          value: headers[key]
        });
      }
      return {
        type: 'normalRequest',
        statusLine: `http/1.1 ${statusCode} status text`,
        url: requestUrl,
        responseHeaders: responseHeaders,
      };
    }

  });


  describe("UnescapeHeader", () => {

    it("shouldn't unescape header, if token invalid", () => {
      const {UnescapeHeader} = WebRequest;

      function assetDoNothing(details) {
        const {requestHeaders: headers} = UnescapeHeader.perform(details);
        H.assertEqual(getHeaderValue(headers, 'Accept'), '*/*');
        H.assertEqual(getHeaderValue(headers, 'x-mxwc-origin'), "https://a.org");
        H.assertEqual(getHeaderValue(headers, 'x-mxwc-referer'), "https://a.org/index.html");
        H.assertEqual(getHeader(headers, 'Origin'), undefined);
        H.assertEqual(getHeader(headers, 'Referer'), undefined);
      }

      // without token
      assetDoNothing(getDetails({
        "Accept": "*/*",
        "x-mxwc-origin": "https://a.org",
        "x-mxwc-referer": "https://a.org/index.html",
      }));

      // invalid token
      assetDoNothing(getDetails({
        "Accept": "*/*",
        "x-mxwc-origin": "https://a.org",
        "x-mxwc-referer": "https://a.org/index.html",
        "x-mxwc-token": "invalid-token",
      }));

    });

    it("unescapeHeader", () => {
      const {UnescapeHeader} = WebRequest;
      const details = getDetails({
        "Accept": "*/*",
        "origin": "moz-extension/xxx",
        "Referer": "https://a.org/index.html",
        "X-MxWc-Token": REQUEST_TOKEN,
        "X-MxWc-Origin": "$REMOVE_ME",
        "x-mxwc-referer": "https://a.org",
      });

      const {requestHeaders: headers} = UnescapeHeader.perform(details);
      H.assertEqual(getHeader(headers, 'origin'), undefined);
      H.assertEqual(getHeader(headers, 'Origin'), undefined);
      H.assertEqual(getHeader(headers, 'x-mxwc-token'), undefined);
      H.assertEqual(getHeader(headers, 'Token'), undefined);
      H.assertEqual(getHeaderValue(headers, 'Accept'), '*/*');
      H.assertEqual(getHeaderValue(headers, 'Referer'), 'https://a.org');
    });


    function getHeaderValue(headers, name) {
      const header = getHeader(headers,name);
      if (header) {
        return header.value;
      } else {
        return undefined;
      }
    }

    function getHeader(headers, name) {
      return headers.find((it) => it.name === name);
    }

    function getDetails(headers) {
      const requestHeaders = [];
      for(let key in headers) {
        requestHeaders.push({
          name: key,
          value: headers[key]
        });
      }
      return { requestHeaders: requestHeaders };
    }
  });


});
