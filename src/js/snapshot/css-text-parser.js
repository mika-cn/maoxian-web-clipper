
const DICT = {'(': ')', '"': '"', "'": "'"};
const MODE = {OUT: 1, IN: 2}; // not inside name and value;

// @param {String} cssText - is the value from style.cssText;
function parse(cssText) {
  const obj = {};

  let mode = MODE.OUT;
  let buffer = '';
  let leftChar;
  let currName;


  let prevChar = '';

  for (let i = 0; i < cssText.length; i++) {
    const ch = cssText[i];
    if (leftChar) {
      if (ch == DICT[leftChar] && prevChar != '\\') {
        leftChar = null;
      }
      buffer += ch;
      prevChar = ch;
    } else {
      if (mode == MODE.OUT) {
        if (ch == ' ' || ch == '\n' || ch == '\t') {
          // we don't care
        } else {
          mode = MODE.IN;
          buffer += ch;
          prevChar = ch;
          if (DICT[ch]) { leftChar = ch }
        }
      } else {
        if (ch == ':' && prevChar != '\\') {
          currName = buffer.trim();
          buffer = '';
          prevChar = '';
          mode = MODE.OUT;
        } else if (ch == ';' && prevChar != '\\') {
          obj[currName] = buffer.trim();
          currName = null;
          buffer = '';
          prevChar = '';
          mode = MODE.OUT;
        } else {
          buffer += ch;
          prevChar = ch;
          if (DICT[ch]) { leftChar = ch }
        }
      }
    }
  }

  return obj;
}

export default {parse};
