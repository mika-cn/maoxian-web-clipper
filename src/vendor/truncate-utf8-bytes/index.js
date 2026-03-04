// truncate-utf-string (v1.0.2)

// Truncate string by size in bytes
function truncate(string, byteLength) {
  if (typeof string !== "string") {
    throw new Error("Input must be string");
  }

  let charLength = string.length;
  let curByteLength = 0;
  let codePoint;
  let segment;

  for (let i = 0; i < charLength; i += 1) {
    codePoint = string.charCodeAt(i);
    segment = string[i];

    if (isHighSurrogate(codePoint) && isLowSurrogate(string.charCodeAt(i + 1))) {
      i += 1;
      segment += string[i];
    }

    curByteLength += getByteLength(segment);

    if (curByteLength === byteLength) {
      return string.slice(0, i + 1);
    }
    else if (curByteLength > byteLength) {
      return string.slice(0, i - segment.length + 1);
    }
  }

  return string;
};



// Truncate string by size in bytes
function getByteLength(string) {
  if (typeof string !== "string") {
    throw new Error("Input must be string");
  }

  let charLength = string.length;
  let byteLength = 0;
  let codePoint = null;
  let prevCodePoint = null;
  for (let i = 0; i < charLength; i++) {
    codePoint = string.charCodeAt(i);
    // handle 4-byte non-BMP chars
    // low surrogate
    if (isLowSurrogate(codePoint)) {
      // when parsing previous hi-surrogate, 3 is added to byteLength
      if (prevCodePoint != null && isHighSurrogate(prevCodePoint)) {
        byteLength += 1;
      }
      else {
        byteLength += 3;
      }
    }
    else if (codePoint <= 0x7f ) {
      byteLength += 1;
    }
    else if (codePoint >= 0x80 && codePoint <= 0x7ff) {
      byteLength += 2;
    }
    else if (codePoint >= 0x800 && codePoint <= 0xffff) {
      byteLength += 3;
    }
    prevCodePoint = codePoint;
  }

  return byteLength;
};

function isHighSurrogate(codePoint) {
  return codePoint >= 0xd800 && codePoint <= 0xdbff;
}

function isLowSurrogate(codePoint) {
  return codePoint >= 0xdc00 && codePoint <= 0xdfff;
}

export default truncate;
