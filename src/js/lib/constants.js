
// Deprecated
// @see https://developer.mozilla.org/en-US/docs/Web/API/CSSRule/type
// Belowing values are equal to cssRule.type.
const CSS_RULE_TYPE_NUM = defineEnum([
  'UNKNOWN',
  'STYLE',
  'CHARSET',
  'IMPORT',
  'MEDIA',
  'FONT_FACE',
  'PAGE',
  'KEYFRAMES',
  'KEYFRAME',
  'MARGIN',
  'NAMESPACE',
  'COUNTER_STYLE',
  'SUPPORTS',
  'DOCUMENT',
  'FONT_FEATURE_VALUES',
  'VIEWPORT',
  'REGION_STYLE',
], 0);


// We should update belowing list regularly.
//  goto http://developer.mozilla.org/en-US/docs/Web/API , and search "Rule".
//
// @see https://developer.mozilla.org/en-US/docs/Web/API/CSSRule
// @see https://developer.mozilla.org/en-US/docs/Web/API/CSSConditionRule
// these are new CSS rules that don't have a type value (they may have a default: 0)
const CSS_RULE_TYPE_NEW = defineEnum([
  'FONT_PALETTE_VALUES',
  'LAYER_STATEMENT',
  'LAYER_BLOCK',
  'PROPERTY',
  'CONTAINER',
], 1000);

export const CSSRULE_TYPE = Object.freeze(
  Object.assign({}, CSS_RULE_TYPE_NUM, CSS_RULE_TYPE_NEW)
)


// css rule class name => type value
export const CSSRULE_TYPE_DICT = {
  CSSStyleRule             : CSSRULE_TYPE.STYLE,
  CSSCharsetRule           : CSSRULE_TYPE.CHARSET,
  CSSImportRule            : CSSRULE_TYPE.IMPORT,
  CSSMediaRule             : CSSRULE_TYPE.MEDIA,
  CSSFontFaceRule          : CSSRULE_TYPE.FONT_FACE,
  CSSPageRule              : CSSRULE_TYPE.PAGE,
  CSSKeyframesRule         : CSSRULE_TYPE.KEYFRAMES,
  CSSKeyframeRule          : CSSRULE_TYPE.KEYFRAME,
  CSSMarginRule            : CSSRULE_TYPE.MARGIN,
  CSSNamespaceRule         : CSSRULE_TYPE.NAMESPACE,
  CSSCounterStyleRule      : CSSRULE_TYPE.COUNTER_STYLE,
  CSSSupportsRule          : CSSRULE_TYPE.SUPPORTS,
  CSSFontFeatureValuesRule : CSSRULE_TYPE.FONT_FEATURE_VALUES,
  CSSFontPaletteValuesRule : CSSRULE_TYPE.FONT_PALETTE_VALUES,
  CSSViewportRule          : CSSRULE_TYPE.VIEWPORT,
  CSSLayerStatementRule    : CSSRULE_TYPE.LAYER_STATEMENT,
  CSSLayerBlockRule        : CSSRULE_TYPE.LAYER_BLOCK,
  CSSPropertyRule          : CSSRULE_TYPE.PROPERTY,
  CSSContainerRule         : CSSRULE_TYPE.CONTAINER,
};


// @see https://developer.mozilla.org/en-US/docs/Web/API/Node
const DOM_NODE_TYPE = defineEnum([
  'ELEMENT',
  'ATTRIBUTE',
  'TEXT',
  'CDATA_SECTION',
  'ENTITY_REFERENCE',
  'ENTITY',
  'PROCESSING_INSTRUCTION',
  'COMMENT',
  'DOCUMENT',
  'DOCUMENT_TYPE',
  'DOCUMENT_FRAGMENT',
  'NOTATION',
]);

export const NODE_TYPE = Object.assign({}, DOM_NODE_TYPE, {
  // custom Node types
  'HTML_STR': 101,
});

function defineEnum(names, start = 1) {
  return Object.freeze(
    names.reduce((obj, name, index) => {
      obj[name] = index + start;
      return obj;
    }, {})
  );
}

