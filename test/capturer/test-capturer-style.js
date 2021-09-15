import H from '../helper.js';
import CapturerStyle from '../../src/js/capturer/style.js';
import {NODE_TYPE, CSSRULE_TYPE} from '../../src/js/lib/constants.js';

const Capturer = H.wrapAsyncCapturer(CapturerStyle);

function getParams() {
  return {
    docUrl: 'https://a.org/index.html',
    baseUrl: 'https://a.org/index.html',
    storageInfo: {
      mainFileFolder: 'category-a/clippings',
      assetFolder: 'category-a/clippings/assets',
    },
    clipId: '001',
    config: {
      saveWebFont: false,
      saveCssImage: false
    }
  }
}

describe('Capture style', () => {
  it("remove nonce", async () => {
    const node = {type: NODE_TYPE.ELEMENT, name: 'STYLE', attr: {nonce: 'nonceStr'},
      sheet: {
        href: undefined,
        diabled: false,
        title: 'TITLE',
        rules: [
          {
            type: CSSRULE_TYPE.STYLE,
            selectorText: 'body',
            styleObj: {background: 'red'}
          }
        ]
      }
    }

    const params = getParams();
    const r = await Capturer.capture(node, params);
    H.assertEqual(r.tasks.length, 0);
    H.assertTrue(r.change.deletedAttr('nonce'));
    H.assertTrue(node.childNodes.length > 0);
    H.assertEqual(node.childNodes[0].text, 'body {\n  background: red;\n}');
  });
});
