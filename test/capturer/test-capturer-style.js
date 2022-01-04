import H from '../helper.js';
import CapturerStyle from '../../src/js/capturer/style.js';
import {NODE_TYPE, CSSRULE_TYPE} from '../../src/js/lib/constants.js';

const Capturer = H.wrapAsyncCapturer(CapturerStyle);

function getParams(change = {}) {
  return Object.assign({
    baseUrl: 'https://a.org/index.html',
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
    },
    clipId: '001',
    config: {
      htmlCaptureWebFont: 'remove',
      htmlCaptureCssImage: 'remove',
    },
    cssParams: {removeUnusedRules: false},
  }, change);
}

describe('Capture style', () => {
  it("remove nonce and should set 'needEscape' of text node to false", async () => {
    const node = {type: NODE_TYPE.ELEMENT, name: 'STYLE', attr: {nonce: 'nonceStr'},
      sheet: {
        href: undefined, diabled: false, title: 'TITLE',
        rules: [
          {
            type: CSSRULE_TYPE.STYLE,
            selectorText: 'body',
            styleObj: {background: 'red'}
          },
          {
            type: CSSRULE_TYPE.STYLE,
            selectorText: 'body > .main',
            styleObj: {color: 'black'}
          },
        ]
      }
    }

    const cssText = [
      'body {\n  background: red;\n}',
      'body > .main {\n  color: black;\n}',
    ].join("\n");

    node.childNodes = [
      {
        type: NODE_TYPE.TEXT,
        needEscape: true, // because it has ">", simulate snapshot/snapshot.js
        text: cssText,
      }
    ]


    const params = getParams();
    const {change, tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    H.assertTrue(change.deletedAttr('nonce'));
    H.assertEqual(node.childNodes.length, 1);
    const textNode = node.childNodes[0];
    H.assertEqual(textNode.text, cssText);

    // styleNode's text content should not escape
    H.assertFalse(textNode.needEscape);
  });

  it("should ignore when captured result is blank", async() => {
    const node = {type: NODE_TYPE.ELEMENT, name: 'STYLE',
      sheet: {
        href: undefined, diabled: false, title: 'TITLE',
        rules: [
          {
            type: CSSRULE_TYPE.STYLE,
            ignore: true,
            selectorText: 'body',
            styleObj: {},
          }
        ]
      }
    };

    const params = getParams({cssParams: {removeUnusedRules: true}});
    const {change, tasks} = await Capturer.capture(node, params);
    H.assertEqual(tasks.length, 0);
    H.assertTrue(change.getProperty('ignore'));
  });
});
