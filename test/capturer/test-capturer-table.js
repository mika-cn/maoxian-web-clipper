
import H from '../helper.js';
import CapturerTable from '../../src/js/capturer/table.js';
const Capturer = H.wrapCapturer(CapturerTable);

describe('Capture TABLE', () => {

  it("Should not capture empty table if we save it as markdown", () => {

    const node = {type: 1, name: 'TABLE', attr: {}, childNodes: []}
    const saveFormat = 'md';
    const {change} = Capturer.capture(node, {saveFormat});
    H.assertTrue(change.getProperty('ignore'));

  });


});
