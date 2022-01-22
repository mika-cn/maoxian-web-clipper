
const PREFIX              = "data-mx-";
const ORDER_BY_INDEX      = "order-by-index";
const INDEX               = "index";
const LOCKED_STYLE_PREFIX = "locked-style-";

class MxAttribute {

  constructor() {
    this.attr = {}
    this.attrLen = 0;
    this.lockedStyle = {}
    this.lockedStyleLen = 0;
  }


  add(attr) {
    const mxAttrName = attr.name.substring(PREFIX.length);
    switch(mxAttrName) {
      case ORDER_BY_INDEX:
        this.attr.orderByIndex = true;
        this.attrLen++;
        break;
      case INDEX:
        this.attr.index = attr.value;
        this.attrLen++;
        break;
      default: {
        if (mxAttrName.startsWith(LOCKED_STYLE_PREFIX)) {
          const propertyName = mxAttrName.substring(LOCKED_STYLE_PREFIX.length);
          this.lockedStyle[propertyName] = attr.value;
          this.lockedStyleLen++;
        } else {
          console.debug("Unknow maoxian attribute: ", attr.name);
        }
      }
    }
  }

  get exist() {
    return this.attrLen > 0 || this.lockedStyleLen > 0
  }

  toObject() {
    let r = {};
    if (this.attrLen > 0) { r = this.attr }
    if (this.lockedStyleLen > 0) { r.lockedStyle = this.lockedStyle }
    return r;
  }
}

MxAttribute.is = (attr) => { return (attr.name.startsWith(PREFIX)) };

export default MxAttribute;
