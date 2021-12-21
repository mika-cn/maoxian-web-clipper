
class StyleScope {

  constructor() {
    this.childScopes = [];

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
   * @param {Object} scope - child scope.
   */
  addChildScope(scope) {
    this.childScopes.push(scope);
  }

  defineFont(fontName) { this.definedFonts.add(fontName) }

  defineKeyFrames(keyFramesName) { this.definedKeyFrames.add(keyFramesName) }

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
    const names = this._splitFontFamilyText(fontFamilyText);
    names.forEach((name) => { this.referencedFonts.add(name) });
  }

  addKeyFramesReference(animationNameText) {
    if (!animationNameText) {return;}
    const names = this._splitAnimationNameText(animationNameText);
    names.forEach((name) => { this.referencedKeyFrames.add(name) });
  }

  addKeyFrameFontReference(keyFramesName, fontFamilyText) {
    if (!fontFamilyText) {return;}
    const fontNames = this._splitFontFamilyText(fontFamilyText);
    for (const fontName of fontNames) {
      if (!this.keyFrameFontMap[keyFramesName]) {
        this.keyFrameFontMap[keyFramesName] = new Set();
      }
      this.keyFrameFontMap[keyFramesName].add(fontName);
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

    for (const childScope of this.childScopes) {
      handleReferencedFonts(this.definedFonts, childScope.referencedAncestorFonts);
      handleReferencedKeyFrames(this.definedKeyFrames, childScope.referencedAncestorKeyFrames);
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

  //FIXME
  _splitFontFamilyText(it) {
    return it.split(",").map((it) => it.trim());
  }

  //FIXME
  _splitAnimationNameText(it) {
    return it.split(",").map((it) => it.trim());
  }
}

export default StyleScope;
