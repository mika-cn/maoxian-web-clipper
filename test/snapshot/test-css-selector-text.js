import H from '../helper.js'
import CssSelectorText from '../../src/js/snapshot/css-selector-text.js'


describe("CSS selector text", () => {

  function changeTo(input, expect) {
    const result = CssSelectorText.simplify(input);
    it(`simplify(), input: ${input}, expect: ${expect}`, () => {
      H.assertEqual(result, expect);
    });
  }

  function unchange(input) {changeTo(input, input)}


  unchange("*");
  changeTo("ns|*", "*");
  changeTo("ns|A", "A");
  changeTo("*|*", "*");
  unchange("elementname");
  unchange(".classname");
  unchange("#idname");
  unchange("[attr]");
  unchange("[attr=value]");
  unchange("[attr='value']");
  unchange('[attr="value"]');
  unchange("[attr~=value]");
  unchange("[attr|=value]");
  unchange("[attr^=value]");
  unchange("[attr$=value]");
  unchange("[attr*=value]");
  unchange("[attr*=value i]");
  changeTo("[open]", "*");
  changeTo("A[open]", "A");
  changeTo("A[attr][open]", "A[attr]");
  changeTo("A[open][attr]", "A[attr]");
  changeTo("A[open][attr=value s]", "A[attr=value s]");

  unchange("A,B");
  unchange("A B");
  unchange("A > B");
  unchange("A ~ B");
  unchange("A + B");
  unchange("A || B");

  changeTo("it:actived", "it");
  unchange("it:first-child");
  changeTo("it:first-child:actived", "it:first-child");
  changeTo("it:actived:first-child", "it:first-child");
  unchange("it:dir(rtl)");
  unchange("it:lang(en)");
  changeTo(":host", "*");
  changeTo(":host(#id)", '*');
  changeTo(":host-context(.xxx)", '*');
  unchange("it:is(main article .classname)");

  changeTo("it:before", "it");
  changeTo("it::before", "it");
  changeTo("it::first-line", "it");

  changeTo("it:before[attr]", "it[attr]");
  changeTo("it[attr]:after", "it[attr]");

  changeTo(":actived", "*");
  changeTo("it :actived", "it *");
  changeTo("it, :actived", "it, *");
  changeTo("it > :actived", "it > *");
  changeTo("it ~ :actived", "it ~ *");
  changeTo("it + :actived", "it + *");
  changeTo("it || :actived", "it || *");
  changeTo("it>:actived", "it>*");

  changeTo(":actived:actived:actived B:actived:first-child", "* B:first-child");
  changeTo("B:actived:first-child :actived:actived:actived", "B:first-child *");
  changeTo(":not(:actived)", '*');
  changeTo("[attr~=value]::first-line:actived", "[attr~=value]");
  changeTo(":has(> img)", '*');
  changeTo("it:unknown-class-name", "it");
  changeTo("::unknown-element-name", "*");
  changeTo(":host(#id)[attr=value]:first-child[open]", "[attr=value]:first-child");

});
