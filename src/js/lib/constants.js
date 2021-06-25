
export const CSSRULE_TYPE = defineEnum([
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

