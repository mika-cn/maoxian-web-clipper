
const PREFIX              = "data-mx-";
const LOCKED_STYLE_PREFIX = "locked-style-";

const ORDER_BY_INDEX      = "order-by-index";
const SAVE_AS_IMG         = "save-as-img";
const INDEX               = "index";
const KEEP                = "keep";
const IGNORE              = "ignore";
const LAYOUT_TABLE        = "layout-table";
const FORMULA_DISPLAY     = "formula-display";

const IGNORE_MD           = "ignore-md";
const MD_DISPLAY_BLOCK    = "md-display-block";
const MD_DISPLAY_INLINE   = "md-display-inline";


class MxAttribute {

  constructor() {
    this.attr = {}
    this.attrLen = 0;
    this.lockedStyle = {}
    this.lockedStyleLen = 0;
  }


  // @param {Object} attr {:name, value}
  add(attr) {
    if (!MxAttribute.is(attr)) return;

    const mxAttrName = attr.name.substring(PREFIX.length);
    switch(mxAttrName) {
      case ORDER_BY_INDEX:
        this.attr.orderByIndex = true;
        this.attrLen++;
        break;
      case SAVE_AS_IMG:
        this.attr.saveAsImg = true;
        this.attrLen++;
      case INDEX:
        this.attr.index = attr.value;
        this.attrLen++;
        break;
      case LAYOUT_TABLE:
        this.attr.layoutTable = true;
        this.attrLen++;
        break;
      case FORMULA_DISPLAY:
        this.attr.formulaDisplay = (attr.value || 'inline');
        this.attrLen++;
        break;
      case IGNORE_MD:
        this.attr.ignoreMd = true;
        this.attrLen++;
        break;
      case MD_DISPLAY_BLOCK:
        this.attr.mdDisplayBlock = true;
        this.attrLen++;
        break;
      case MD_DISPLAY_INLINE:
        this.attr.mdDisplayInline = true;
        this.attrLen++;
        break;
      case KEEP:
        this.attr.keep = true;
        this.attrLen++;
        break;
      case IGNORE:
        this.attr.ignore = true;
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

  // to a serializable object
  toObject() {
    let r = {};
    if (this.attrLen > 0) { r = this.attr }
    if (this.lockedStyleLen > 0) { r.lockedStyle = this.lockedStyle }
    return r;
  }



}

// Some maoxian attributes are useful in takeSnapshot process only (these can be ignore)
// others are useful after toHTML process (these must be keep)
MxAttribute.toHTMLAttrObject = (mxAttrObj) => {
  if(!mxAttrObj) { return {}}
  const r = {};
  if (mxAttrObj.hasOwnProperty('layoutTable')) {
    r[MxAttribute.LAYOUT_TABLE] = mxAttrObj.layoutTable;
  }
  if (mxAttrObj.hasOwnProperty('keep')) {
    r[MxAttribute.KEEP] = mxAttrObj.keep;
  }
  if (mxAttrObj.hasOwnProperty('formulaDisplay')) {
    r[MxAttribute.FORMULA_DISPLAY] = mxAttrObj.formulaDisplay;
  }

  if (mxAttrObj.hasOwnProperty('ignoreMd')) {
    r[MxAttribute.IGNORE_MD] = mxAttrObj.ignoreMd;
  }

  if (mxAttrObj.hasOwnProperty('mdDisplayBlock')) {
    r[MxAttribute.MD_DISPLAY_BLOCK] = mxAttrObj.mdDisplayBlock
  }
  if (mxAttrObj.hasOwnProperty('mdDisplayInline')) {
    r[MxAttribute.MD_DISPLAY_INLINE] = mxAttrObj.mdDisplayBlock
  }
  return r;
}


MxAttribute.is = (attr) => { return (attr.name.startsWith(PREFIX)) };
MxAttribute.KEEP            = PREFIX + KEEP;
MxAttribute.IGNORE          = PREFIX + IGNORE;
MxAttribute.INDEX           = PREFIX + INDEX;
MxAttribute.LAYOUT_TABLE    = PREFIX + LAYOUT_TABLE;
MxAttribute.FORMULA_DISPLAY = PREFIX + FORMULA_DISPLAY;
MxAttribute.IGNORE_MD       = PREFIX + IGNORE_MD;
MxAttribute.MD_DISPLAY_BLOCK = PREFIX + MD_DISPLAY_BLOCK;
MxAttribute.MD_DISPLAY_INLINE = PREFIX + MD_DISPLAY_INLINE;
MxAttribute.SAVE_AS_IMG = PREFIX + SAVE_AS_IMG;

export default MxAttribute;
