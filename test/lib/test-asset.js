import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import Asset from '../../src/js/lib/asset.js';


import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);

import Window from '../mock/window.js';

describe("Asset", () => {

  describe('getNameByLink', () => {

    const template = '$DOMAIN_$TITLE_$TIME-INTSEC-$MD5URL$EXT';
    const valueObj = {
      now: Date.now(),
      domain: 'a.org',
      title: 'awesomeTitle',
    }

    it("getNameByLink: link only", () => {
      const link = 'https://a.org/foo.jpg';
      const name = Asset.getNameByLink({template, valueObj, link});
      H.assertMatch(name, /^a.org_awesomeTitle_[^\.\/]+\.jpg$/);
    });

    it("getNameByLink: with extension", () => {
      const link = 'https://a.org/foo.jpg';
      const name = Asset.getNameByLink({
        template: template,
        valueObj: valueObj,
        link: link,
        extension: 'txt',
      });
      H.assertMatch(name, /^a.org_awesomeTitle_[^\.\/]+\.txt$/);
    });

    it("getNameByLink: link doesn't has an extension", () => {
      const link = 'https://a.org/foo';
      const name = Asset.getNameByLink({template, valueObj, link});
      H.assertMatch(name, /^a.org_awesomeTitle_[^\.\/]+$/);
    })


    it("getNameByLink: with webUrlMimeType", () => {
      const link = 'https://a.org/foo.bmp';
      const name = Asset.getNameByLink({
        template: template,
        valueObj: valueObj,
        link: link,
        mimeTypeData: {
          webUrlMimeType: 'image/jpeg',
          attrMimeType: 'image/png'
        },
      });
      H.assertMatch(name, /^a.org_awesomeTitle_[^\.\/]+\.bmp$/);
    });

    it("getNameByLink: with attrMimeType", () => {
      const link = 'https://a.org/foo.bmp';
      const name = Asset.getNameByLink({
        template: template,
        valueObj: valueObj,
        link: link,
        mimeTypeData: {
          attrMimeType: 'image/png'
        },
      });
      H.assertMatch(name, /^a.org_awesomeTitle_[^\.\/]+\.bmp$/);
    });

    it("getNameByLink: invalid image file extension", () => {
      const link = 'https://a.org/foo.image?id=xxx';
      const name = Asset.getNameByLink({
        template: template,
        valueObj: valueObj,
        link: link,
        mimeTypeData: {
          attrMimeType: 'image/png'
        },
        resourceType: 'image'
      });
      H.assertMatch(name, /^a.org_awesomeTitle_[^\.\/]+\.png$/);
    });

    it("getNameByLink: data link", () => {
      const link = 'data:image/png;base64,imagedata';
      const nameA = Asset.getNameByLink({
        template: template,
        valueObj: valueObj,
        link: link,
        mimeTypeData: {
          webUrlMimeType: 'image/png'
        }
      });
      H.assertMatch(nameA, /^a.org_awesomeTitle_[^\.\/]+\.png$/);
    });

  });


  describe('getWebUrlMimeType', () => {
    const getSamplePngBytes = () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    const getSamplePngBinStr = () => {
      return Array.from(getSamplePngBytes(), (x) => String.fromCodePoint(x)).join('')
    }

    const getSamplePngBlob = () => {
      const bytes = getSamplePngBytes();
      return new Blob([bytes]);
    }

    it("getWebUrlMimeType - data url", async () => {
      const url = 'data:image/png;base64,imagedata';
      const params = {url};
      const mimeType = await Asset.getWebUrlMimeType(params);
      H.assertEqual(mimeType, 'image/png');
    });

    it("getWebUrlMimeType - data url(unknown type)", async () => {
      const pngBinStr = getSamplePngBinStr();
      const base64Data = btoa(pngBinStr);
      const url = `data:application/octet-stream;base64,${base64Data}`;
      const params = {url};
      const mimeType = await Asset.getWebUrlMimeType(params);
      H.assertEqual(mimeType, 'image/png');
    });


    it("getWebUrlMimeType - blob url", async () => {
      const blob = getSamplePngBlob();
      const url = 'blob:https://a.org/blobID';
      const params = {url};
      Window.mockFetchBlob(url, blob);
      const mimeType = await Asset.getWebUrlMimeType(params);
      H.assertEqual(mimeType, 'image/png');
      Window.clearMocks();
    });

    it("getWebUrlMimeType - http url", async () => {
      const url = 'https://a.org/a.png';
      const params = {url};
      const mimeType = await Asset.getWebUrlMimeType(params);
      H.assertEqual(mimeType, null);
    });

    it("getWebUrlMimeType - http url, get mimeType from background", async () => {
      const url = 'https://a.org/a';
      const params = {url};
      ExtMsg.mockMsgResult('get.mimeType', 'image/png');
      const mimeType = await Asset.getWebUrlMimeType(params);
      H.assertEqual(mimeType, 'image/png');
    });

    it("getWebUrlMimeType - http url, get mimeType from background failed", async () => {
      const url = 'https://a.org/a';
      const params = {url};
      ExtMsg.mockMsgResult('get.mimeType', '__EMPTY__');
      const mimeType = await Asset.getWebUrlMimeType(params);
      H.assertEqual(mimeType, null);
    });


  });

});

