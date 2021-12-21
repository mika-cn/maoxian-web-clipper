import H from '../helper.js'
import StyleScope from '../../src/js/snapshot/style-scope.js'

function mockStyle(properties) {
  return {
    properties,
    getPropertyValue: function(name) {
      return (this.properties[name] || '');
    },
  };
}

describe("Style Scope", () => {

  it("should work when target properties not exist", () => {
    const style = mockStyle({});
    const scope = new StyleScope();
    scope.recordReferences(style);
    const obj = scope.toObject();
    H.assertEqual(Object.keys(obj.usedFont).length, 0);
    H.assertEqual(Object.keys(obj.usedKeyFrames).length, 0);
    H.assertEqual(obj.referencedAncestorFonts.length, 0);
    H.assertEqual(obj.referencedAncestorKeyFrames.length, 0);
  });

  it("should handle key frames", () => {
    const style = mockStyle({ 'animation-name': 'A, B' });
    const scope = new StyleScope();
    scope.recordReferences(style);
    scope.defineKeyFrames('A');
    scope.defineKeyFrames('C');
    scope.defineKeyFrames('D');

    const cScopeA = new StyleScope();
    const cScopeB = new StyleScope();
    const cStyleA = mockStyle({'animation-name': 'A, X, Y'});
    const cStyleB = mockStyle({'animation-name': 'D, Y, Z'});

    cScopeA.defineKeyFrames('Y');

    cScopeA.recordReferences(cStyleA);
    cScopeB.recordReferences(cStyleB);

    scope.addChildScope(cScopeA.toObject());
    scope.addChildScope(cScopeB.toObject());

    const obj = scope.toObject();

    H.assertTrue(obj.usedKeyFrames['A']);
    H.assertEqual(obj.usedKeyFrames['B'], undefined);
    H.assertEqual(obj.usedKeyFrames['C'], undefined);
    // referenced in child scope cScopeB
    H.assertTrue(obj.usedKeyFrames['D']);

    H.assertEqual(obj.referencedAncestorKeyFrames.length, 4);
    // from scope
    H.assertTrue(obj.referencedAncestorKeyFrames.indexOf('B') > -1);
    // from cScopeA
    H.assertTrue(obj.referencedAncestorKeyFrames.indexOf('X') > -1);
    // From cScopeB
    H.assertTrue(obj.referencedAncestorKeyFrames.indexOf('Y') > -1);
    H.assertTrue(obj.referencedAncestorKeyFrames.indexOf('Z') > -1);
  });

  it("should handle fonts", () => {
    const style = mockStyle({'font-family': 'A, B'});
    const scope = new StyleScope();
    scope.recordReferences(style);
    scope.defineFont('A');
    scope.defineFont('C');
    scope.defineFont('D');
    scope.defineFont('E');

    scope.defineKeyFrames('KF-E');
    scope.defineKeyFrames('KF-F');
    const _style = mockStyle({'animation-name': 'KF-E'});
    scope.recordReferences(_style);

    const keyFrameStyleE = mockStyle({'font-family': 'E'});
    const keyFrameStyleF = mockStyle({'font-family': 'F'});
    scope.recordKeyFrameFontReferences('KF-E', keyFrameStyleE);
    scope.recordKeyFrameFontReferences('KF-F', keyFrameStyleF);

    const cScopeA = new StyleScope();
    const cScopeB = new StyleScope();
    const cStyleA = mockStyle({'font-family': 'A, X, Y'});
    const cStyleB = mockStyle({'font-family': 'D, Y, Z'});

    cScopeA.defineFont('Y');

    cScopeA.recordReferences(cStyleA);
    cScopeB.recordReferences(cStyleB);

    scope.addChildScope(cScopeA.toObject());
    scope.addChildScope(cScopeB.toObject());

    const obj = scope.toObject();

    H.assertTrue(obj.usedFont['A']);
    H.assertEqual(obj.usedFont['B'], undefined);
    H.assertEqual(obj.usedFont['C'], undefined);
    // referenced in child scope cScopeB
    H.assertTrue(obj.usedFont['D']);
    // referenced in keyFrameStyleE
    H.assertTrue(obj.usedFont['E']);
    // although the font(F) is referenced inside key frames(KF-F),
    // but the key frames itself was not referenced
    // so it is not used.
    H.assertEqual(obj.usedFont['F'], undefined);

    H.assertTrue(obj.usedKeyFrames['KF-E'])
    // key frames 'KF-F' was defined, but wasn't referenced.
    H.assertEqual(obj.usedKeyFrames['KF-F'], undefined);



    H.assertEqual(obj.referencedAncestorFonts.length, 4);
    // from scope
    H.assertTrue(obj.referencedAncestorFonts.indexOf('B') > -1);
    // from cScopeA
    H.assertTrue(obj.referencedAncestorFonts.indexOf('X') > -1);
    // From cScopeB
    H.assertTrue(obj.referencedAncestorFonts.indexOf('Y') > -1);
    H.assertTrue(obj.referencedAncestorFonts.indexOf('Z') > -1);

    H.assertEqual(obj.referencedAncestorKeyFrames.length, 0);
  });


});
