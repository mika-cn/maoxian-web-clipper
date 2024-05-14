import MxAttribute  from './mx-attribute.js';

function handleNormalAndMxAttrs(elem) {
  const attrObj = {};
  const mxAttr = new MxAttribute();

  Array.prototype.forEach.call(elem.attributes, (attr) => {
    if (MxAttribute.is(attr)) {
      mxAttr.add(attr);
    } else {
      attrObj[attr.name] = attr.value;
    }
  });

  const result = {attrObj};
  if (mxAttr.exist) {
    result.mxAttrObj = mxAttr.toObject();
  }

  return result;
}


function handleNormalAttrs(elem) {
  const attrObj = {};
  Array.prototype.forEach.call(elem.attributes, (attr) => {
    attrObj[attr.name] = attr.value;
  });
  return attrObj;
}

function hasMxAttrKeep(elem) {
  return elem.hasAttribute(MxAttribute.KEEP);
}

function hasMxAttrIgnore(elem) {
  return elem.hasAttribute(MxAttribute.IGNORE);
}

export default {
  handleNormalAttrs,
  handleNormalAndMxAttrs,
  hasMxAttrKeep,
  hasMxAttrIgnore,
  MX_INDEX: MxAttribute.INDEX,
};
