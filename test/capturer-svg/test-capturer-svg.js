
import H from '../helper.js';
import CapturerSvg from '../../src/js/capturer-svg/svg.js';
const Capturer = H.wrapCapturer(CapturerSvg);

function getNode(nestedSvg = false) {
  const node = {type: 1, name: 'SVG', attr: {}};
  node.nestedSvg = nestedSvg;
  node.mxAttr = {saveAsImg: true};
  return node;
}

describe('Capturer SVG', () => {

  it("do not set namespace if it's nested svg", () => {
    const node = getNode(true);
    const r = Capturer.capture(node, {});
    H.assertFalse(r.change.hasAttr('xmlns'))
  });

  it("set namespace", () => {
    const node = getNode();
    const r = Capturer.capture(node, {});
    H.assertTrue(r.change.hasAttr('xmlns'))
  });

});
