
class StyleScope {

  constructor() {
    this.childScopeObjs = [];

    // definitions
    this.definedFonts = new Set();
    this.definedKeyFrames = new Set();

    // references
    this.referencedFonts = new Set();// Note: It excludes those inside keyFrames.
    this.referencedKeyFrames = new Set();

    // Collect font references that used inside keyFrame.
    // we don't know the keyFrames is used or not,
    // untill we finish the current tree scope.
    this.keyFrameFontMap = {}; // keyFramesName => [referencedFontName]
  }

  /*
   * @param {Object} scopeObj - child scope.
   */
  addChildScopeObj(scopeObj) {
    this.childScopeObjs.push(scopeObj);
  }

  defineFont(fontName) {
    this.definedFonts.add(unescapeCustomIdentifier(fontName));
  }

  defineKeyFrames(keyFramesName) {
    this.definedKeyFrames.add(keyFramesName);
  }

  recordReferences(style) {
    const fontFamilyText = style.getPropertyValue('font-family');
    this.addFontReference(fontFamilyText);
    const animationNameText = style.getPropertyValue('animation-name');
    this.addKeyFramesReference(animationNameText);
  }

  recordKeyFrameFontReferences(keyFramesName, style) {
    const fontFamilyText = style.getPropertyValue('font-family');
    this.addKeyFrameFontReference(keyFramesName, fontFamilyText);
  }


  addFontReference(fontFamilyText) {
    if (!fontFamilyText) {return;}
    const names = splitTextByComma(fontFamilyText);
    names.forEach((name) => {
      this.referencedFonts.add(unescapeCustomIdentifier(name));
    });
  }

  addKeyFramesReference(animationNameText) {
    if (!animationNameText) {return;}
    const names = splitTextByComma(animationNameText);
    names.forEach((name) => {
      this.referencedKeyFrames.add(unescapeAnimationName(name));
    });
  }

  addKeyFrameFontReference(keyFramesName, fontFamilyText) {
    if (!fontFamilyText) {return;}
    const fontNames = splitTextByComma(fontFamilyText);
    for (const fontName of fontNames) {
      if (!this.keyFrameFontMap[keyFramesName]) {
        this.keyFrameFontMap[keyFramesName] = new Set();
      }
      this.keyFrameFontMap[keyFramesName].add(unescapeCustomIdentifier(fontName));
    }
  }

  toObject() {

    const obj = {
      usedFont: {},
      usedKeyFrames: {},
    };

    const referencedAncestorFonts = new Set();
    const referencedAncestorKeyFrames = new Set();

    const handleReferencedKeyFrames = (definedKeyFrames, referencedKeyFrames) => {
      for (const name of referencedKeyFrames) {
        if (definedKeyFrames.has(name)) {
          obj.usedKeyFrames[name] = true;
        } else {
          referencedAncestorKeyFrames.add(name);
        }
      }
    }

    const handleReferencedFonts = (definedFonts, referencedFonts) => {
      for (const name of referencedFonts) {
        if (definedFonts.has(name)) {
          obj.usedFont[name] = true;
        } else {
          referencedAncestorFonts.add(name);
        }
      }
    }

    handleReferencedFonts(this.definedFonts, this.referencedFonts);
    handleReferencedKeyFrames(this.definedKeyFrames, this.referencedKeyFrames);

    for (const childScopeObj of this.childScopeObjs) {
      handleReferencedFonts(this.definedFonts, childScopeObj.referencedAncestorFonts);
      handleReferencedKeyFrames(this.definedKeyFrames, childScopeObj.referencedAncestorKeyFrames);
    }

    for (const keyFramesName in this.keyFrameFontMap) {
      if (obj.usedKeyFrames[keyFramesName]) {
        handleReferencedFonts(this.definedFonts, this.keyFrameFontMap[keyFramesName]);
      }
    }

    obj.referencedAncestorFonts = Array.from(referencedAncestorFonts);
    obj.referencedAncestorKeyFrames = Array.from(referencedAncestorKeyFrames);

    return obj;
  }

}

function splitTextByComma(it) {
  return it.split(",").map((it) => it.trim());
}

/**
 * Quoted custom Idents are invalid.
 *
 * There's a weird behavior on Firefox that you can use
 * quoted customIdent in @keyframes name and
 * animation-name property value, but Firefox only trim
 * the quotes in @keyframes name. And even in this case,
 * Firefox will correctly referrence these two names.
 *
 * We handle this, because it's an used @keyframes.
 */
function unescapeAnimationName(it) {
  const lastIdx = it.length - 1;
  let customIdent;
  if (lastIdx !== 0 && it[0] == `"` && it[lastIdx] == `"`) {
    customIdent = it.substring(1, lastIdx);
  } else if (lastIdx !== 0 && it[0] == `'` && it[lastIdx] == `'`) {
    customIdent = it.substring(1, lastIdx);
  } else {
    customIdent = it;
  }
  return unescapeCustomIdentifier(customIdent);
}



/* @param {String} it customIdent (can only handle CSS property value)
 * @see @mdn/en-US/docs/Web/CSS/custom-ident
 */
function unescapeCustomIdentifier(it) {
  // Unicode character: "\" + (one to six hexadecimal digits)
  // escapted character: "\" + char
  // " ?" means there may be one space after the unicode character,
  // this was added by browsers, not sure why they did this.
  const re = /\\(?:([A-Fa-f0-9]{1,6}) ?|(.))/g
  return it.replace(re, (m, m1, m2) => {
    if (m1) {
      // Unicode character, m1 is an Unicode code point
      return String.fromCodePoint(parseInt(m1, 16));
    } else {
      // escapted character, m2 is the character
      return m2;
    }
  });
}

export default StyleScope;
