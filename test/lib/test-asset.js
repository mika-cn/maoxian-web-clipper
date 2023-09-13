import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import Asset from '../../src/js/lib/asset.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);

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
    it("getWebUrlMimeType - data url", async () => {
      const url = 'data:image/png;base64,imagedata';
      const params = {url};
      const mimeType = await Asset.getWebUrlMimeType(params);
      H.assertEqual(mimeType, 'image/png');

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



    // How can we mock fetch API ?
    // it("getWebUrlMimeType - blob url", async () => {
    //   const url = 'blob:https://a.org/blobID';
    //   const params = {url};
    //   // mock fetch API here
    //   const mimeType = await Asset.getWebUrlMimeType(params);
    //   H.assertEqual(mimeType, 'image/png');
    // });
  });

});

