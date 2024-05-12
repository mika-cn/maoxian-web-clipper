
import H from '../helper.js';
import CapturerSvg from '../../src/js/capturer-svg/svg.js';
const Capturer = H.wrapCapturer(CapturerSvg);

function getNode(appendAttrs = {}) {
  const node = {type: 1, name: 'SVG', attr: {}};
  node.mxAttr = {saveAsImg: true};
  node.attr = Object.assign({}, node.attr, appendAttrs);
  return node;
}

describe('Capturer SVG', () => {

  it("set namespace", () => {
    const node = getNode();
    const r = Capturer.capture(node, {});
    H.assertTrue(r.change.hasAttr('xmlns'))
  });

});
