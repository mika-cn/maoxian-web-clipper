import H from '../helper.js';
import WebRequest from '../../src/js/background/web-request.js';

const REQUEST_TOKEN = 'abcd';
WebRequest.init({requestToken: REQUEST_TOKEN});


describe('WebRequest', () => {

  describe('StoreMimeType', () => {

    it('should store mimeType if request url has not file extension', () => {
      const {StoreMimeType} = WebRequest;
      StoreMimeType.init();
      const url = 'https://a.org/image';
      const details = getDetails('200', url,
        {'Content-Type': 'image/png'}
      );
      StoreMimeType.emit(details);
      const dict = StoreMimeType.getMimeTypeDict();
      H.assertEqual(dict[url], 'image/png');
    });

    it('should not store mimeType if request url has file extension', () => {
      const {StoreMimeType} = WebRequest;
      StoreMimeType.init();
      const url = 'https://a.org/image.png';
      const details = getDetails('200', url,
        {'Content-Type': 'image/png'}
      );
      StoreMimeType.emit(details);
      const dict = StoreMimeType.getMimeTypeDict();
      H.assertEqual(dict[url], undefined);
    });

    it('should store redirection', () => {
      const {StoreMimeType} = WebRequest;
      StoreMimeType.init();
      const originalUrl = 'http://a.org/image';
      const targetUrl = 'https://a.org/image.jpg';
      const detailsA = getDetails('301', originalUrl,
        { 'Content-Type': 'text/html', 'Location': targetUrl }
      );
      const detailsB = getDetails('200', targetUrl,
        { 'Content-Type': 'image/jpeg' }
      );
      StoreMimeType.emit(detailsA);
      StoreMimeType.emit(detailsB);

      const dict = StoreMimeType.getMimeTypeDict();
      H.assertEqual(dict[originalUrl], 'image/jpeg');
    });

    it('should store redirection that has multiply hops', () => {
      const {StoreMimeType} = WebRequest;
      StoreMimeType.init();
      const originalUrl = 'http://a.org/origin';
      const middleUrl = 'https://a.org/middle';
      const targetUrl = 'https://a.org/final';
      const detailsA = getDetails('301', originalUrl,
        { 'Content-Type': 'text/html', 'Location': middleUrl }
      );
      const detailsB = getDetails('301', middleUrl,
        { 'Content-Type': 'text/html', 'Location': targetUrl }
      );
      const detailsC = getDetails('200', targetUrl,
        {'Content-Type': 'image/jpeg'}
      );
      StoreMimeType.emit(detailsA);
      StoreMimeType.emit(detailsB);
      StoreMimeType.emit(detailsC);

      const dict = StoreMimeType.getMimeTypeDict();
      H.assertEqual(dict[originalUrl], 'image/jpeg');
      H.assertEqual(dict[middleUrl], undefined);
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
