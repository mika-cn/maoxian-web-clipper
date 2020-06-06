
import H from '../helper.js';
import T from '../../src/js/lib/tool.js';
import VariableRender from '../../src/js/lib/variable-render.js';


describe("VariableRender", () => {
  it('should render builtin function', () => {
    const variables = VariableRender.TimeVariables;
    const str = '$YYYY-$YY-$MM-$DD-$HH-$mm-$SS-$TIME-INTSEC';
    const now = Date.now();
    const s = T.wrapNow(now).str;
    const v = {now: now}
    const r = VariableRender.exec(str, v, variables)
    H.assertEqual(r, [s.year, s.sYear, s.month, s.day, s.hour, s.minute, s.second, s.intSec].join('-'));
  });

  it('should render default function', () => {
    const variables = ['$STORAGE-PATH'];
    const str = '$STORAGE-PATH/static';
    const v = {storagePath: 'downloads/root'}
    const r = VariableRender.exec(str, v, variables)
    H.assertEqual(r, 'downloads/root/static');
  });

  it("shouldn't render variable which we haven't specified", () => {
    const variables = ['$A'];
    const str = '$A-$B-$C';
    const v = {'a': 'a', 'b': 'b', 'c': 'c'};
    const r = VariableRender.exec(str, v, variables)
    H.assertEqual(r, 'a-$B-$C');
  });
});


