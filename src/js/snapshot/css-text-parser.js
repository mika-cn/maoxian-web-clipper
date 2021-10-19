
const MODE = {OUT: 1, IN: 2}; // not inside name and value;

// @param {String} cssText - CSS declaration, is the value from style.cssText;
// @return {Object} styleObj - e.g. {left: '13px', color: '#ccc !important'};

function parse(cssText) {
  const obj = {};

  const leftChars = new LeftChars();
  let mode = MODE.OUT;
  let buffer = '';
  let currName;


  let prevChar = '';

  for (let i = 0; i < cssText.length; i++) {
    // skip escaped char, only can handle those inside "" or ''.
    while (cssText[i] == `\\`) {
      buffer += cssText[i]
      prevChar = '';
      i += 1; // point to next char
      if (i < cssText.length) {
        buffer += cssText[i];
        i += 1;
      }
    }
    if (i >= cssText.length) { break; }

    const ch = cssText[i];

    if (leftChars.length > 0) {

      const nChar = leftChars.nCharCanPop(prevChar, ch);
      // console.log(nChar, leftChars.paired);
      if (nChar > 0) {
        leftChars.pop(nChar);
        prevChar = '';
      } else if (leftChars.canPush) {
        if (LeftChars.isLeft(ch)) {
          leftChars.push(ch);
          prevChar = '';
        } else {
          prevChar = ch;
        }
      } else {
        prevChar = ch;
      }
      buffer += ch;
      // console.log(leftChars.stack, buffer, leftChars.paired);
    } else {
      if (mode == MODE.OUT) {
        if (ch == ' ' || ch == '\n' || ch == '\t') {
          // we don't care
        } else {
          mode = MODE.IN;
          if (LeftChars.isLeft(ch)) {
            leftChars.push(ch);
            prevChar = '';
          } else {
            prevChar = ch;
          }
          buffer += ch;
        }
      } else {
        if (ch == ':') {
          currName = buffer.trim();
          buffer = '';
          prevChar = '';
          mode = MODE.OUT;
        } else if (ch == ';') {
          const value = buffer.trim();
          if (currName) {
            obj[currName] = value;
          } else {
            // ignore;
          }
          currName = null;
          buffer = '';
          prevChar = '';
          mode = MODE.OUT;
        } else {
          if (LeftChars.isLeft(ch)) {
            leftChars.push(ch);
            prevChar = '';
          } else {
            prevChar = ch;
          }
          buffer += ch;
        }
      }
    }
  }

  return obj;
}


/*
stack of left chars.

 (   nestable => true
 ("  nestable => false
 ('  nestable => false

 "   nestable => false
 '   nestable => false

*/

const DICT = {'(': ')', '"': '"', "'": "'"};

class LeftChars {

  constructor() {
    // store left chars
    this.stack = [];
    // which index is paired, {stackIndex: true}
    this.paired = {};
  }

  get length() {
    return this.stack.length;
  }

  get isEmpty() {
    return this.stack.length == 0;
  }

  get topIndex() {
    return this.stack.length - 1;
  }

  get top() {
    return this.stack[this.topIndex];
  }

  get canPush() {
    return this.isEmpty || this.top == '(';
  }

  push(leftChar) {
    if (this.length != 0 && leftChar != '(') {
      this.paired[this.length] = true;
    }
    this.stack.push(leftChar);
  }

  pop(nChar = 1) {
    let i = nChar;
    while(i-- > 0) {
      if(this.paired[this.topIndex]) {
        this.paired[this.topIndex] = false;
      }
      this.stack.pop();
    }
  }

  nCharCanPop(prevChar, currChar) {
    if (this.isEmpty) { return 0 }

    const topIdx = this.topIndex;
    const isPaired = this.paired[topIdx];

    if (isPaired) {
      return (DICT[this.stack[topIdx]] == prevChar
        && DICT[this.stack[topIdx - 1]] == currChar ? 2 : 0);
    } else {
      return DICT[this.stack[topIdx]] == currChar ? 1 : 0;
    }
  }
}

LeftChars.isLeft = (ch) => !!DICT[ch];


export default {parse};
