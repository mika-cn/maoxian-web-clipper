import H from '../helper.js'
import Parser from '../../src/js/snapshot/css-text-parser.js'


describe('CssTextParser', () => {

  function testPropertyName(name, appendDesc = "") {
    const descText = `test CSS property name: ${name} (${appendDesc})`;
    it(descText, () => {
      const k = name;
      const t = `${k}: v;`;
      const obj = Parser.parse(t);
      H.assertEqual(obj[k], 'v');
    });
  }

  testPropertyName("k"           , "single part");
  testPropertyName("foo-bar-baz" , "multiple part");
  testPropertyName("-moz-k"      , "platform relative");
  testPropertyName("--custom-k"  , "custom name");

  function testPropertyValue(v, appendDesc = "") {
    const currDesc = `CSS property value: ${v}`;
    const desc = appendDesc ? [currDesc, appendDesc].join(", ") : currDesc;
    it(desc, () => {
      const obj = Parser.parse(`k:${v};`);
      H.assertEqual(obj.k, v);
    });
  }

  testPropertyValue(`p1 p2 p3`, 'with multiple parts');
  testPropertyValue(`"v"`);
  testPropertyValue(`'v'`);

  testPropertyValue(`"a\\:c"`, 'with escaped cahr');
  testPropertyValue(`"a\\;c"`, 'with escaped cahr');
  testPropertyValue(`"\\""`, 'with escaped char');
  testPropertyValue(`"\\a\\b\\c"`, 'has multiple escaped char');
  //illegle:
  //testPropertyValue(`\\a`, 'start with escaped char');
  //illegle:
  //testPropertyValue(`'\\'`, 'only has escaped char');

  testPropertyValue(`(":")`);
  testPropertyValue(`(";")`);
  testPropertyValue(`(")")`);
  //illegle: testPropertyValue(`("")")`);

  testPropertyValue(`"" "" ";" ""`)

  testPropertyValue("url(v)");
  testPropertyValue("url('v')");
  testPropertyValue("var(--bg-color-A, var(--bg-color-B), white)");
  testPropertyValue("calc(var(--widthA) / 2)")
  testPropertyValue("local(a), local(b), url(c)");
  testPropertyValue("linear-gradient(to bottom rgb(0,0,0), rgba(0,0,0,0.5)), url('xxx')", "multiple background images");


  it("test multiple CSS propertis", () => {
    const t = "a:v1; b: v2;c:  v3;";
    const obj = Parser.parse(t);
    H.assertEqual(obj.a, 'v1');
    H.assertEqual(obj.b, 'v2');
    H.assertEqual(obj.c, 'v3');
  })



});
