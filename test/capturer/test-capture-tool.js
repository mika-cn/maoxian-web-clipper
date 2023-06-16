import browser from 'sinon-chrome';
global.browser = browser;

import H from '../helper.js';
import CaptureTool from '../../src/js/capturer/tool.js';
import RequestParams from '../../src/js/lib/request-params.js';

import ExtMsg from '../mock/ext-msg.js';
ExtMsg.initBrowser(browser);
ExtMsg.mockGetUniqueFilename();

describe('CaptureTool', () => {

  function getParams() {
    const url = 'https://a.org/index.html';
    return {
      baseUrl: url,
      storageInfo: {
        mainFileFolder: 'category-a/clippings',
        assetFolder: 'category-a/clippings/assets',
        raw: { assetFileName: '$TIME-INTSEC-$MD5URL$EXT' },
        valueObj: {now: Date.now()},
      },
      clipId: '001',
      config: {
        htmlCaptureImage: 'saveAll',
        htmlCaptureCssImage: 'saveAll',
      },
      requestParams: RequestParams.createExample({refUrl: url}),
    }
  }

  describe('captureBackgroundAttr', () => {

    function getNode() {
      return {type: 1, name: 'DIV', attr: {}}
    }

    it('it should capture empty background', async () => {
      const node = getNode();
      const params = getParams();
      const r = await CaptureTool.captureBackgroundAttr(node, params);
      H.assertEqual(r.tasks.length, 0);
    });

    it('it should capture background', async () => {
      const node = getNode();
      node.attr.background = 'assets/a.jpg';
      const params = getParams();
      const r = await CaptureTool.captureBackgroundAttr(node, params);
      H.assertEqual(r.tasks.length, 1);
    });

    it('it should not capture background if config is not true', async () => {
      const node = getNode();
      node.attr.background = 'assets/a.jpg';
      const params = getParams();
      params.config.htmlCaptureCssImage = 'remove';
      const r = await CaptureTool.captureBackgroundAttr(node, params);
      H.assertEqual(r.tasks.length, 0);
    });

  });

  describe('captureImageSrcset', () => {

    function getNode() {
      return {type: 1, name: 'img',
        attr: { src: 'https://a.org/a.jpg' }
      };
    }

    it('should capture srcset', async () => {
      const node = getNode();
      node.attr.srcset = "https://a.org/a.jpg 1x, https://a.org/b.jpg 2x";
      const params = getParams();
      const r = await CaptureTool.captureImageSrcset(node, params);
      const change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 2);
      // should join value with comma and space;
      H.assertTrue(change.getAttr('srcset').indexOf(', ') > -1);
    });

  });

  describe('parseSrcset', () => {

    it('should handle one url', () => {
      const srcset = "https://a.org/a.jpg";
      const arr = CaptureTool.parseSrcset(srcset);
      H.assertEqual(arr.length, 1);
      H.assertEqual(arr[0].length, 1);
    });

    it('should handle multiple urls - comma + space', () => {
      const srcset = "https://a.org/a.jpg, https://a.org/b.jpg";
      const arr = CaptureTool.parseSrcset(srcset);
      H.assertEqual(arr.length, 2);
    });

    it('should handle multiple urls - comma (invalid)', () => {
      const srcset = "https://a.org/a.jpg,https://a.org/b.jpg";
      const arr = CaptureTool.parseSrcset(srcset);
      H.assertEqual(arr.length, 1);
      H.assertEqual(arr[0].length, 1);
      H.assertEqual(arr[0][0], srcset);
    });

    it('should handle urls with descriptor - comma + space', () => {
      const srcset = "https://a.org/a-200.jpg 1x, https://a.org/a-400.jpg 2x"
      const arr = CaptureTool.parseSrcset(srcset);
      H.assertEqual(arr.length, 2);
      H.assertEqual(arr[0][1], '1x');
      H.assertEqual(arr[1][1], '2x');
    });

    it('should handle urls with descriptor - comma', () => {
      const srcset = "https://a.org/a-200.jpg 200w,https://a.org/a-400.jpg 400w"
      const arr = CaptureTool.parseSrcset(srcset);
      H.assertEqual(arr.length, 2);
      H.assertEqual(arr[0][1], '200w');
      H.assertEqual(arr[1][1], '400w');
    });

    it('should handle url that contains comma', () => {
      const srcset = "https://a.org/foo,bar/a.jpg 1x, https://a.org/foo,bar/b.jpg 2x";
      const arr = CaptureTool.parseSrcset(srcset);
      H.assertEqual(arr.length, 2);
      H.assertEqual(arr[0][1], '1x');
      H.assertEqual(arr[1][1], '2x');
    });


    it('should handle data url', () => {
      const srcset = "data:image/webp;base64,aaa 1x, data:image/jpeg;base64,bbb 2x";
      const arr = CaptureTool.parseSrcset(srcset);
      H.assertEqual(arr.length, 2);
      H.assertEqual(arr[0][1], '1x');
      H.assertEqual(arr[1][1], '2x');
    });
  });




  describe('captureAttrResource', () => {

    function getNode(attr = {}) {
      return {type: 1, name: 'XXX', attr}
    }

    it('attribute is not exist', async () => {
      const node = getNode();
      const params = getParams();
      const attrParams = {resourceType: 'image', attrName: 'src'}
      let r, change;

      r = await CaptureTool.captureAttrResource(node, params, attrParams);
      change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 0);
      H.assertTrue(change.hasAttr('data-mx-warn'));
      H.assertFalse(change.hasAttr('data-mx-original-src'));


      attrParams.canEmpty = true;
      r = await CaptureTool.captureAttrResource(node, params, attrParams);
      change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 0);
      H.assertFalse(change.hasAttr('data-mx-warn'));
    });

    it('attribute is ""', async() => {
      const node = getNode({src: ''});
      const params = getParams();
      const attrParams = {resourceType: 'image', attrName: 'src'}
      const r = await CaptureTool.captureAttrResource(node, params, attrParams);
      const change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 0);
      H.assertTrue(change.hasAttr('data-mx-warn'));
      H.assertTrue(change.hasAttr('data-mx-original-src'));
    });

    it('attribute has invalid value', async() => {
      const node = getNode({src: 'http://:300', type: 'video/mp4'});
      const params = getParams();
      const attrParams = {resourceType: 'video', attrName: 'src', mimeTypeAttrName: 'type'}
      const r = await CaptureTool.captureAttrResource(node, params, attrParams);
      const change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 0);
      H.assertTrue(change.hasAttr('data-mx-warn'));
      H.assertTrue(change.hasAttr('data-mx-original-src'));
      H.assertTrue(change.hasAttr('data-mx-original-type'));
    });

    it('attribute has value', async () => {
      const node = getNode({src: 'test.mp3'});
      const params = getParams();
      const attrParams = {resourceType: 'audio', attrName: 'src'}
      const r = await CaptureTool.captureAttrResource(node, params, attrParams);
      const change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 1);
      H.assertEqual(r.tasks[0].taskType, 'audioFileTask')
      H.assertTrue(change.hasAttr('src'))
      H.assertFalse(change.hasAttr('data-mx-warn'));
    });


    it('attribute has value, with attrValue', async () => {
      const node = getNode({src: 'test.png'});
      const params = getParams();
      const attrParams = {resourceType: 'image', attrName: 'src', attrValue: 'test.svg'};
      const r = await CaptureTool.captureAttrResource(node, params, attrParams);
      const change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 1);
      H.assertTrue(change.getAttr('src').endsWith('.svg'));
    });


    it('attribute has value, with extension', async () => {
      const node = getNode({src: 'test'});
      const params = getParams();
      const attrParams = {resourceType: 'textTrack', attrName: 'src', extension: 'vtt'};
      const r = await CaptureTool.captureAttrResource(node, params, attrParams);
      const change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 1);
      H.assertTrue(r.tasks[0].filename.endsWith('.vtt'));
      H.assertTrue(change.getAttr('src').endsWith('.vtt'))
    });


    it('attribute has value, with mimeTypeAttrName', async () => {
      const node = getNode({src: 'test', type: 'image/svg+xml'});
      const params = getParams();
      const attrParams = {resourceType: 'image', attrName: 'src', mimeTypeAttrName: 'type'};
      const r = await CaptureTool.captureAttrResource(node, params, attrParams);
      const change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 1);
      H.assertTrue(r.tasks[0].filename.endsWith('.svg'));
      H.assertTrue(change.getAttr('src').endsWith('.svg'))
    });

    it('attribute has value, target mimeTypeAttr has not value', async () => {
      const node = getNode({src: 'test'});
      const params = getParams();
      const attrParams = {resourceType: 'image', attrName: 'src', mimeTypeAttrName: 'type'};
      ExtMsg.mockMsgResult('get.mimeType', 'image/svg+xml');
      const r = await CaptureTool.captureAttrResource(node, params, attrParams);
      const change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 1);
      H.assertTrue(change.getAttr('src').endsWith('.svg'))
    });

    it('can capture multiple attributes', async () => {
      const node = getNode({src: 'test.mp4', poster: 'poster.jpg'});
      const params = getParams();
      const attrParams = [
        {resourceType: 'video', attrName: 'src'},
        {resourceType: 'image', attrName: 'poster'},
      ];
      const r = await CaptureTool.captureAttrResource(node, params, attrParams);
      const change = r.change.toChangeObjectAccessor();
      H.assertEqual(r.tasks.length, 2);
      H.assertTrue(change.hasAttr('src'));
      H.assertTrue(change.hasAttr('poster'));
    });
  });

  describe('isFilterMatch', () => {
    it('should not match, if filter text is ""', () => {
      const filterText = "";
      const url = "https://a.org/test.png";
      const mimeType = "image/png";
      H.assertFalse(CaptureTool.isFilterMatch(filterText, url, mimeType));
    })

    it('should not match, if filter text are all comments', () => {
      const filterText = "#comment";
      const url = "https://a.org/test.png";
      const mimeType = "image/png";
      H.assertFalse(CaptureTool.isFilterMatch(filterText, url, mimeType));
    });

    it('should match <images>, mimeType', () => {
      const filterText = "<images>";
      const url = "https://a.org/test.png";
      const mimeType = "image/jpeg";
      H.assertTrue(CaptureTool.isFilterMatch(filterText, url, mimeType));
    });

    it('should match <images>, dataUrl', () => {
      const filterText = "<images>";
      const url = "data:image/jpeg;base64,xxx";
      const mimeType = "";
      H.assertTrue(CaptureTool.isFilterMatch(filterText, url, mimeType));
    });

    it('should match <audios>, url', () => {
      const filterText = "<audios>";
      const url = "https://a.org/test.mp3";
      const mimeType = "";
      H.assertTrue(CaptureTool.isFilterMatch(filterText, url, mimeType));
    });

    it('should not match <videos>, both url and mimeType can not match', () => {
      const filterText = "<videos>";
      const url = "https://a.org/test.html";
      const mimeType = "text/html";
      H.assertFalse(CaptureTool.isFilterMatch(filterText, url, mimeType));
    });

    it('should match extension', () => {
      const filterText = "<images>,pdf";
      const url = "https://a.org/test.pdf";
      const mimeType = 'application/pdf';
      H.assertTrue(CaptureTool.isFilterMatch(filterText, url, mimeType));
    });

    it('should match extension of data url', () => {
      const filterText = "woff, woff2";
      const url = 'data:font/woff2;base64,xxx';
      const mimeType = undefined;
      H.assertTrue(CaptureTool.isFilterMatch(filterText, url, mimeType));
    });

    it('should match last line', () => {
      const filterText = "<images>\nmp3, wmv, mp4\npdf";
      const url = "https://a.org/test.pdf";
      const mimeType = null;
      H.assertTrue(CaptureTool.isFilterMatch(filterText, url, mimeType));
    });


  });


});

