import T           from '../lib/tool.js';
import MxAttribute from './mx-attribute.js';

class SnapshotAccessor {
  constructor(snapshot) {
    this.node = snapshot;
    this._change = snapshot.change;
    this.defineGetter([
      'name',
      'type',
      'ignore',
      'ignoreReason',
      'isShadowHost',
      'isShadowRoot',
      'render',
      'errorMessage',
      'needEscape',
      'text',
      'html',
    ]);
  }

  set change(v) {
    this._change = v;
  }

  get tagName() {
    return this.name.toLowerCase();
  }

  get childNodes() {
    return this.node.childNodes || [];
  }

  get startTag() {
    return '<' + this.tagName + this.getAttrHTML() + '>';
  }

  get endTag() {
    return '</' + this.tagName + '>';
  }

  getAttrHTML() {
    const deletedAttr = ((this._change || {}).deletedAttr || {});
    const changedAttr = ((this._change || {}).attr || {});
    const mxHTMLAttr  = MxAttribute.toHTMLAttrObject(this.node.mxAttr)
    const attrObj = Object.assign( {}, (this.node.attr || {}), changedAttr, mxHTMLAttr);

    let attrHTML = '';
    for (let name in attrObj) {
      if (!deletedAttr[name]) {
        if (attrObj[name]) {
          attrHTML += ` ${name}="${T.escapeHtmlAttr(attrObj[name])}"`;
        } else {
          attrHTML += ` ${name}`;
        }
      }
    }
    return attrHTML;
  }

  defineGetter(props) {
    for (const prop of props) {
      this.__defineGetter__(prop, () => {
        return (this._change || {})[prop] || this.node[prop];
      });
    }
  }

}

export default SnapshotAccessor;
