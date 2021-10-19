import H from '../helper.js'
import Parser from '../../src/js/snapshot/css-text-parser.js'


describe('CssTextParser', () => {

  it("test CSS property with normal name", () => {
    const t = "k:v;";
    const obj = Parser.parse(t);
    H.assertEqual(obj.k, 'v');
  });

  it("test CSS property with complicated name", () => {
    const k = "foo-bar-baz";
    const t = `${k}: v;`;
    const obj = Parser.parse(t);
    H.assertEqual(obj[k], 'v');
  });

  it("test multiple CSS propertis", () => {
    const t = "a:v1; b: v2;c:  v3;";
    const obj = Parser.parse(t);
    H.assertEqual(obj.a, 'v1');
    H.assertEqual(obj.b, 'v2');
    H.assertEqual(obj.c, 'v3');
  })


  function testValue(v, tailTxt) {
    const currTxt = `CSS property value: ${v}`;
    const hint = tailTxt ? [currTxt, tailTxt].join(", ") : currTxt;
    it(hint, () => {
      const obj = Parser.parse(`k:${v};`);
      H.assertEqual(obj.k, v);
    });
  }

  testValue(`p1 p2 p3`, 'with multiple parts');
  testValue(`"v"`);
  testValue(`'v'`);
  testValue("url(v)");

  testValue(`"a\\:c"`, 'with escaped cahr');
  testValue(`"a\\;c"`, 'with escaped cahr');
  testValue(`"\\""`, 'with escaped char');
  testValue(`"\\a\\b\\c"`, 'has multiple escaped char');
  //illegle:
  //testValue(`\\a`, 'start with escaped char');
  //illegle:
  //testValue(`'\\'`, 'only has escaped char');

  testValue(`(":")`);
  testValue(`(";")`);
  testValue(`(")")`);
  //illegle: testValue(`("")")`);

  testValue(`"" "" ";" ""`)

  testValue("calc(var(--widthA) / 2)")
  testValue("linear-gradient(to bottom rgb(0,0,0), rgba(0,0,0,0.5)), url('xxx')", "multiple background images");


});
