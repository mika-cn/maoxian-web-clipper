const H = require('../helper.js');
const WebRequest = H.depJs('background/web-request.js');

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
});
