
class SortedArray {
  constructor() {
    this._dict = {};
    this._dictLength = 0;
    this._noIndexed = [];
  }

  get length() {
    return this._length;
  }

  push(value, index) {
    if (index === undefined || index === null) {
      this._noIndexed.push(value);
    } else {
      const v = parseInt(index);
      if (isNaN(v)) {
        this._noIndexed.push(value);
      } else {
        if (this._dict[index]) {
          // shouldn't have value (index conflict)
          this._noIndexed.push(value);
        } else {
          this._dict[index] = value;
          this._dictLength++;
        }
      }
    }
  }

  // make it iterable
  [Symbol.iterator]() {
    let idx = 0;
    // how many items have iterated
    let iteratedNum = 0;
    let noIndexedLen = this._noIndexed.length;
    let dictLen = this._dictLength;

    // return an iterator
    return {
      next: () => {
        // iterate _dict
        if (iteratedNum < dictLen) {
          // skip all empty values
          while(!this._dict[idx]) { idx++; }
          iteratedNum++;
          return {value: this._dict[idx++], done: false};

        } else if (iteratedNum == dictLen) {
          // reset idx, we want to iterate _noIndexed
          idx = 0;
        }

        // iterate _noIndexed
        if (idx < noIndexedLen) {
          iteratedNum++;
          return {value: this._noIndexed[idx++], done: false};
        } else {
          return {done: true};
        }
      }
    }
  }
}

export default SortedArray;
