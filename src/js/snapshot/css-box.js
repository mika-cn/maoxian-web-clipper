
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
  }

  get removeUnusedRules() {
    return this._removeUnusedRules;
  }

  /**
   * @param {Node} node - same as constructor
   * @returns a new CssBox instance
   */
  change({node}) {
    const params = Object.assign(this.toParams(), {node});
    return new CssBox(params);
  }

  /**
   * @returns {Object} params
   *    contains node unrelated params, that can be sent to content frame.
   */
  toParams() {
    return {removeUnusedRules: this._removeUnusedRules};
  }

  scopeToObject() {
    return Object.assign(
      {removeUnusedRules: this._removeUnusedRules},
      this.scope.toObject()
    );
  }
}

export default CssBox;
