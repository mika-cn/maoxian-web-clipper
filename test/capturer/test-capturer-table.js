
import H from '../helper.js';
import CapturerTable from '../../src/js/capturer/table.js';
const Capturer = H.wrapCapturer(CapturerTable);

describe('Capture TABLE', () => {

  it("should capture non-empty table", () => {
    const node = {type: 1, name: 'TABLE', attr: {}, childNodes: [
      {type: 1, name: 'THEAD', attr: {}, childNodes: []}
    ]};
    const r1 = Capturer.capture(node, {saveFormat: 'md'});
    H.assertEqual(r1.change.getProperty('ignore'), undefined);

    const r2 = Capturer.capture(node, {saveFormat: 'html'});
    H.assertEqual(r1.change.getProperty('ignore'), undefined);
  });


  it("Should not capture empty table if we save it as markdown", () => {

    const node = {type: 1, name: 'TABLE', attr: {}, childNodes: []}
    const saveFormat = 'md';
    const {change} = Capturer.capture(node, {saveFormat});
    H.assertTrue(change.getProperty('ignore'));

  });


});
