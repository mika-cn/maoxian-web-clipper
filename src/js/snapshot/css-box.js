
import StyleScope from './style-scope.js';
import {SelectorTextMatcher} from './css-selector-text.js';

/**
 * CssBox contains useful tools to:
 *   - detect whether a css rule can match element in selected area
 *   - remember defined tree-scoped names (@font-face, @key-frames)
 *   - remember referenced tree-scoped names (font-family, animation-name)
 */

class CssBox {

  /**
   * @param {Element|Document|ShadowRoot} node
   * @param {Boolean} removeUnusedRules
   */
  constructor({node, removeUnusedRules = false}) {
    this._removeUnusedRules = removeUnusedRules;
    this._node = node;
    this.selectorTextMatcher = new SelectorTextMatcher(node);
    this.scope = new StyleScope();
    this.childBoxes = [];
  }

  setSnapshot(snapshot) {
    this._snapshot = snapshot;
  }

  get removeUnusedRules() {
    return this._removeUnusedRules;
  }

  /**
   * @param {Node} node - same as constructor
   * @returns a new child CssBox instance
   */
  createChildBox({node}) {
    const params = Object.assign(this.toParams(), {node});
    const childBox = new CssBox(params);
    this.childBoxes.push(childBox);
    return childBox;
  }

  /**
   * @param {Node} node - same as constructor
   * @returns a new parent CssBox instance
   */
  createParentBox({node}) {
    const params = Object.assign(this.toParams(), {node});
    const parentBox = new CssBox(params);
    parentBox.childBoxes.push(this);
    return parentBox;
  }

  /**
   * @returns {Object} params
   *    contains node unrelated params, that can be sent to content frame.
   */
  toParams() {
    return {removeUnusedRules: this._removeUnusedRules};
  }

  /**
   * will be called when the whole takeSnapshot process completed.
   */
  finalize() {
    if (!this._snapshot) {
      throw new Error("snapshot not exist! Did you forget to setSnapshot()");
    }

    for (const childBox of this.childBoxes) {
      childBox.finalize();
      this.scope.addChildScopeObj(childBox.scopeObj);
    }

    // scope to object
    this.scopeObj = Object.assign(
      {removeUnusedRules: this._removeUnusedRules},
      this.scope.toObject()
    );

    // assign scope obj to snapshot
    this._snapshot.styleScope = this.scopeObj;
  }

}

export default CssBox;
