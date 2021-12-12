

// Pseudo-classes
//   @see MDN/en-US/docs/Web/CSS/Pseudo-classes
//
//  name => keep
const PSEUDO_CLASSES_DICT = {
  "active"   : false,
  "any-link" : false,
  "autofill" : false,
  "blank"    : false,
  "checked"  : false,
  "current"  : false,
  "default"  : false,
  "defined"  : true,
  "dir"      : true,
  "disabled" : true,
  "empty"    : true,
  "enabled"  : true,

  "first-child"   : true,
  "first-of-type" : true,
  "first"         : false,
  "focus-visible" : false,
  "focus-within"  : false,
  "focus"         : false,
  "fullscreen"    : false,
  "future"        : false,
  // 'a:has(> img)', not supported in any browser yet(20211207).
  "has"           : true,
  "host-context"  : true,
  "host"          : true,
  "hover"         : false,
  "in-range"      : false,
  "indeterminate" : false,
  "invalid"       : false,

  "is"          : true,
  "matches"     : true,
  "any"         : true,
  "-moz-any"    : true,
  "-webkit-any" : true,

  "lang"         : true,
  "last-child"   : true,
  "last-of-type" : true,
  "left"         : false,
  "link"         : false,

  // Do not keep not(), because it's too complicated,
  // like :not(:focus) => :not(*) can't match anything.
  "not"              : false,
  "nth-child"        : true, // nth-child(2)
  "nth-last-child"   : true,
  "nth-last-of-type" : true,
  "nth-of-type"      : true,

  "only-child"   : true,
  "only-of-type" : true,
  "optional"     : true,
  "out-of-range" : false,

  "pass"              : false,
  "paused"            : false,
  "picture"           : false,
  "placeholder-shown" : false,
  "playing"           : false,

  "read-only"  : true,
  "read-write" : true,
  "required"   : true,
  "right"      : false,
  "root"       : true,

  "scope": false, // FIXME? relative scope
  "state": false,

  "target"          : false,
  "target-within"   : false,
  "user-invalid"    : false,
  "-moz-ui-invalid" : false,
  "user-valid"      : false,
  "-moz-ui-valid"   : false,

  "valid"   : false,
  "visited" : false,
  "where"   : true,
};


// Pseudo-elements
//   @see MDN/en-US/docs/Web/CSS/Pseudo-elements
//
//  name => keep
const PSEUDO_ELEMENTS_DICT = {
  "before"               : false,
  "after"                : false,
  "backdrop"             : false,
  "cue"                  : false,
  "cue-region"           : false,
  "first-letter"         : true,
  "first-line"           : true,
  "file-selector-button" : false,
  "grammar-error"        : true,
  "marker"               : false,
  "part"                 : true,
  "placeholder"          : false,
  "selection"            : false,
  "-moz-selection"       : false,
  "slotted"              : true,
  "spelling-error"       : true,
  "target-text"          : false,
};


/**
 * We want to detect the selectorText was used on DOM or not.
 * But some selectorText is too strict to use,
 * like `.post-link:visited` which matches nothing if the user
 * didn't click any post links. But we do need to save this css rule.
 *
 * To avoid these rules get removed. We simplify the selectorText by
 *
 * 1. removing some parts of it, which includes :
 *   - namespaces
 *   - some pseudo classes
 *   - some pseudo elements.
 *
 * 2. using the universal selector(*) if the edited selector become empty.
 *
 */
function simplify(selectorText, ancestorPseudoNames = []) {
  /*
  if (ancestorPseudoNames.length > 0) {
    console.log("^^^^^^^^^^^^^^^^^^^^ > ", ancestorPseudoNames)
  }
  */
  const pseudoModifier = function({lastPseudo, basicSelector, pseudoType, pseudoName, pseudoArgsStr}) {
    if (keepPseudo(pseudoType, pseudoName)) {
      if (pseudoArgsStr) {
        // We haven't use the ancestorPseudoNames yet,
        // Is it needed here? (reconsider me)
        return renderPseudo(pseudoType, pseudoName,
          simplify(pseudoArgsStr, [pseudoName, ...ancestorPseudoNames])
        );
      } else {
        return renderPseudo(pseudoType, pseudoName);
      }
    } else {
      return (basicSelector ? '' : (lastPseudo ? '*' : ''));
    }
  }

  return editSelectorText(selectorText, pseudoModifier);
}


function keepPseudo(pseudoType, pseudoName) {
  if (pseudoType === PSEUDO_ELEMENT) {
    return PSEUDO_ELEMENTS_DICT[pseudoName];
  } else {
    return PSEUDO_CLASSES_DICT[pseudoName] || PSEUDO_ELEMENTS_DICT[pseudoName];
  }
}


function renderPseudo(pseudoType, pseudoName, pseudoArgsStr) {
  const prefix = (pseudoType === PSEUDO_ELEMENT ? '::' : ':');
  const argsStr = (pseudoArgsStr ? `(${pseudoArgsStr})` : '');
  return `${prefix}${pseudoName}${argsStr}`;
}






// @see mdn/en-US/docs/Web/CSS/CSS_Selectors
//
// Universal selector
//   `*`, `ns|*`, `*|*`
//
// Type selector
//   `elementname`
//
// Class selector
//   `.classname`
//
// ID selector
//   `#idname`
//
// Attribute Selector
//
//   * [attr]
//   * [attr=value]
//   * [attr~=value]
//   * [attr|=value]
//   * [attr^=value]
//   * [attr$=value]
//   * [attr*=value]
//
//
// Grouping:
//   `,`
//
//
// Combinators:
//   ` `, `>`, `~`, `+`, `||`
//
// Pseudoes
//
//   pseudoClasses(:*)
//   pseudoElements(::*)

const [PSEUDO_KLASS, PSEUDO_ELEMENT] = [1, 2];

// leftChar => rightChar
const DICT = {'(' : ')', '[': ']', '"': '"', "'": "'"};

function editSelectorText(selectorText, pseudoModifier) {
  const removeNamespace = true;
  // MODE_IN means we're inside something.
  const [MODE_OUT, MODE_IN] = [1, 2];

  // Flag, whether we're inside a pseudo or not.
  let pseudoMode = MODE_OUT;
  let pseudoType;
  let pseudoName = '';
  let pseudoArgsStr = '';

  // Flag, whether we're inside basicSelector or not.
  let basicSelectorMode = MODE_OUT;
  let basicSelector = '';
  let basicSelectorAdded = false;

  // stack, push direction: left to right;
  let leftChars = [];
  let result = '';

  const len = selectorText.length;

  for (let i = 0; i < len; i++) {
    const ch = selectorText[i];

    if (pseudoMode === MODE_OUT) {

      if (ch == ':') {
        pseudoMode = MODE_IN;
        basicSelectorMode = MODE_OUT;

        if (!basicSelectorAdded) {
          result += basicSelector
          basicSelectorAdded = true;
        }

        // Is next char a colon?
        if (i + 1 < len && selectorText[i + 1] == ':') {
          pseudoType = PSEUDO_ELEMENT;
          i = i + 1; // skip the next char.
        } else {
          pseudoType = PSEUDO_KLASS;
        }
        pseudoName = '';

      } else {

        if (basicSelectorMode === MODE_OUT) {
          switch(ch) {
            case ' ':
            case '\t':
            case '\n':
            case ',':
            case '>':
            case '~':
            case '+':
            case '|': {
              result += ch;
              break;
            }
            default: {
              basicSelectorMode = MODE_IN;
              basicSelector += ch;
              break;
            }
          }

        } else {
          // inside basic selector
          switch(ch) {
            case ' ':
            case '\t':
            case '\n':
            case ',':
            case '>':
            case '~':
            case '+': {
              result += `${basicSelector}${ch}`;
              basicSelector = '';
              basicSelectorMode = MODE_OUT;
              basicSelectorAdded = false;
              break;
            }
            case '|': {
              if (i + 1 < len) {
                const nextChar = selectorText[i + 1];
                if (nextChar === ch) {
                  // is `||` (column combinator)
                  result += `${basicSelector}${ch}`;
                  basicSelector = '';
                  basicSelectorMode = MODE_OUT;
                  basicSelectorAdded = false;
                } else if (nextChar === '=') {
                  // is `|= (inside attribute selector)
                  basicSelector += ch;
                } else {
                  // is `|` (namespace selector)
                  if (removeNamespace) {
                    basicSelector = '';
                  } else {
                    basicSelector += ch;
                  }
                }
              } else {
                const msg = `editSelectorText(): should not reach here: ${selectorText}`;
                throw new Error(msg);
              }
              break;
            }
            default:
              basicSelector += ch;
              break;
          }
        }
      }


    } else {
      // inside pseudo
      if (leftChars.length > 0) {
        // inside pseudo arguments
        switch(ch) {
          case '(':
          case '[': {
            leftChars.unshift(ch);
            pseudoArgsStr += ch;
            break;
          }
          case ')':
          case ']':
          case '"':
          case "'": {
            if (DICT[leftChars[0]] == ch) {
              // is right char, pop out one left char.
              leftChars.shift();

              if (leftChars.length == 0) {
                // stack is empty
                const lastPseudo = !(i + 1 < len && selectorText[i + 1] == ':')

                result += pseudoModifier({basicSelector, pseudoType, pseudoName, pseudoArgsStr, lastPseudo});
                if (lastPseudo) {
                  basicSelector = ''
                  basicSelectorAdded = false;
                }
                pseudoName = '';
                pseudoArgsStr = '';
                pseudoMode = MODE_OUT;
              } else {
                pseudoArgsStr += ch;
              }
            } else if (ch === '"' || ch === "'") {
              // not a right char, then must be a left char.
              leftChars.unshift(ch);
              pseudoArgsStr += ch;
            } else {
              pseudoArgsStr += ch;
            }
            break;
          }
          default: {
            pseudoArgsStr += ch;
            break;
          }
        }

      } else {
        // outside pseudo arguments
        switch(ch) {
          case '(' : {
            leftChars.unshift('(');
            pseudoArgsStr = '';
            break;
          }
          case ' ':
          case '\t':
          case '\n':
          case ',':
          case '>':
          case '~':
          case '+':
          case '|':
          case ':' : {
            // end of current pseudo.
            let lastPseudo = true;
            if (ch == ':') {
              lastPseudo = false;
              result += pseudoModifier({basicSelector, pseudoType, pseudoName, lastPseudo});
              // step back one index, so that the other branch of code
              // can identify it as a pseudo.
              i -= 1
            } else {
              result += pseudoModifier({basicSelector, pseudoType, pseudoName, lastPseudo});
              result += ch;
              basicSelector = '';
              basicSelectorAdded = false;
            }
            pseudoName = '';
            pseudoMode = MODE_OUT;
            continue;
          }
          default: {
            pseudoName += ch;
          }
        }
      }
    }

  }

  if (pseudoMode === MODE_IN && pseudoName) {
    const lastPseudo = true;
    result += pseudoModifier({basicSelector, pseudoType, pseudoName, lastPseudo});
    pseudoMode = MODE_OUT;
    basicSelectorMode = MODE_OUT;
  }

  if (basicSelectorMode === MODE_IN && basicSelector) {
    result += basicSelector;
    basicSelectorMode = MODE_OUT;
  }

  return result;
}


class Matcher {
  /**
   * @param {Element|DocumentFragment|Document} contextNode
   *    contextNode must has querySelector() function,
   *    and optionally has matches() function.
   *
   * @param {Boolean} enabled
   *
   * @param {String} type 'rootNode', 'selectedNode'
   *
   */
  constructor({contextNode, enabled = true, type = 'rootNode'}) {
    this._enabled = enabled;
    this._contextNode = contextNode;
    this._type = type;
    if (enabled) {
      if (type === 'rootNode') {
        this.nodesToMatch = [contextNode];
      } else {
        this.nodesToMatch = this._getSelectedNodeAndItsAncestors(contextNode);
      }
    }
  }

  toParams() {
    return {
      contextNode : this._contextNode,
      type        : this._type,
      enabled     : this._enabled,
    }
  }

  get enabled() {
    return this._enabled;
  }

  match(selectorText = "") {
    if (!this._enabled) {
      throw new Error("Matcher is not enabled, couldn't call match()");
    }
    if (selectorText === "") {
      // nothing to match, return true for safety
      return true;
    }

    const firstNode = this.nodesToMatch[0];
    let selectorTextInvalid = false;
    try {
      if (firstNode.querySelector(selectorText)) {
        return true;
      }
    } catch(e) {
      // This doesn't mean the selectorText is invalid, It just
      // means the selectorText is not a valid argument to querySelector().
      // For example, namespaced selectors are valid selectors, but they
      // are not supported by querySelector().
      //
      selectorTextInvalid = true;
    }

    // FIXME adding catch ?
    const simplifiedSelectorText = simplify(selectorText);

    if (simplifiedSelectorText === selectorText) {
      if (selectorTextInvalid) {
        // both selector texts are invalid for querySelector() or matches();
        // We can't detect it, just return true for safety.
        //
        return true;
      } else {
        for (const node  of this.nodesToMatch) {
          if (node.matches && node.matches(simplifiedSelectorText)) {
            return true;
          }
        }
        return false;
      }
    } else {
      let simplifiedSelectorTextInvalid = false;
      try {
        if (firstNode.querySelector(simplifiedSelectorText)) {
          return true;
        }
      } catch (e) {
        simplifiedSelectorTextInvalid = true;
      }

      if (selectorTextInvalid && simplifiedSelectorTextInvalid) {
        // both selector texts are invalid for querySelector() or matches();
        // We can't detect it, just return true for safety.
        //
        return true;
      }

      for (const node of this.nodesToMatch) {
        if (node.matches) {
          if ((!selectorTextInvalid) && node.matches(selectorText)) {
            return true;
          }
          if ((!simplifiedSelectorTextInvalid) && node.matches(simplifiedSelectorText)) {
            return true;
          }
        }
      }
      return false;
    }
  }


  _getSelectedNodeAndItsAncestors(node) {
    let arr = [node];
    let currNode = node;
    let pNode;

    while(true) {
      if (currNode.assignedSlot)   {
        // this node is inside custom element(s).
        // it's style isn't isolated(still affected by outside styles)
        //
        // Current node's parentNode equals to it's parentElement.
        pNode = currNode.parentNode
      }
      if (!pNode && currNode.host) {
        // Currently, we can't select elements that inside shadowDOM yet,
        // but if we can, the ancestors of the selected node may be a shadowRoot.
        //
        // In this case, it's style is isolated(won't affected by
        // outside styles). we shouldn't test these shadowDOM elements
        // with outside styles, hence we empty the array and set the
        // parentNode to it's host (a custom element which will affected
        // by outside styles).
        pNode = currNode.host;
        arr = [];
      }
      if (!pNode) {
        pNode = currNode.parentNode;
      }

      if (pNode) {
        arr.push(pNode);
        currNode = pNode;
        pNode = null;
      } else {
        // reach Document node.
        break;
      }
    }
    return arr;
  }
}


export const SelectorTextMatcher = Matcher;
export default {simplify};
