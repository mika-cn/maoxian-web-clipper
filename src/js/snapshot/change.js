
export default class SnapshotNodeChange {

  constructor(items = []) {
    this.items = items;
  }

  setProperty(name, value) {
    this.items.push({name: 'setProperty', args: [name, value]})
  }

  setAttr(name, value) {
    this.items.push({name: 'setAttr', args: [name, value]})
  }

  rmAttr(name) {
    this.items.push({name: 'rmAttr', args: [name]});
  }

  setStyleProperty(name, value) {
    this.items.push({name: 'setStyleProperty', args: [name, value]});
  }

  // =====================

  merge(other) {
    return new SnapshotNodeChange(this.items.concat(other.items));
  }

  toObject() {
    return ApplyChangeItem.perform(this.items,
      {attr: {}, deletedAttr: {}, styleObj: {}}
    );
  }

  toChangeObjectAccessor() {
    return new ChangeObjectAccessor(this.toObject());
  }
}

const ApplyChangeItem = {
  perform(items, initObj = {}) {
    return items.reduce((obj, item) => {
      return this[item.name](obj, ...item.args);
    }, initObj);
  },

  setProperty(obj, name, value) {
    obj[name] = value;
    return obj;
  },

  setAttr(obj, name, value) {
    return this._deepSet(obj, ['attr', name], value)
  },

  rmAttr(obj, name) {
    return this._deepSet(obj, ['deletedAttr', name], true)
  },

  setStyleProperty(obj, name, value) {
    return this._deepSet(obj, ['styleObj', name], value);
  },

  _deepSet(obj, path, value) {
    let currLayer = obj;
    const last = path.length - 1;
    path.forEach((k, idx) => {
      if (!currLayer[k]) { currLayer[k] = {} }
      if (idx != last) {
        currLayer = currLayer[k];
      } else {
        currLayer[k] = value
      }
    })
    return obj;
  },
}

class ChangeObjectAccessor{
  constructor(store) {
    this.store = store;
  }

  getProperty(name) {
    return this.store[name];
  }

  getAttr(name) {
    if (!this.store.attr) {return undefined}
    return this.store.attr[name];
  }

  hasAttr(name) {
    return this._hasPropertyInLevel2(
      this.store, ['attr', name]);
  }

  deletedAttr(name) {
    return this._hasPropertyInLevel2(
      this.store, ['deletedAttr', name]);
  }

  hasStyleProperty(name) {
    return this._hasPropertyInLevel2(
      this.store, ['styleObj', name]);
  }

  toObj() { return this.store }

  // =====================

  _hasPropertyInLevel2(obj, [parentKey, key]) {
    if (!this.store[parentKey]) { return false }
    return this.store[parentKey].hasOwnProperty(key);
  }
}
