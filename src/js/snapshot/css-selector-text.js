
import {NODE_TYPE} from '../lib/constants.js';

// These attributes will be removed from selector (won't be used)
const ATTR_WHITELIST = new Set([
  "open", // <details>
]);

// Pseudo-classes
//   @see MDN/en-US/docs/Web/CSS/Pseudo-classes
//
//  name => keep

// FIXME We need reconsider this dict, it can't be too restrict.
// otherwise we'll damage the page style.
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


  "first-child"   : true, //*
  "first-of-type" : true, //*
  "first"         : false,
  "focus-visible" : false,
  "focus-within"  : false,
  "focus"         : false,
  "fullscreen"    : false,
  "future"        : false,
  // 'a:has(> img)', not supported in any browser yet(20211207).
  "has"           : false, //*
  "host-context"  : false, //-
  "host"          : false, //-
  "hover"         : false,
  "in-range"      : false,
  "indeterminate" : false,
  "invalid"       : false,

  "is"          : true, //*
//  "matches"     : true, //* renamed to "is"
//  "any"         : true, //*
  "-moz-any"    : true, //*
  "-webkit-any" : true, //*


  "lang"         : true,
  "last-child"   : true,//*
  "last-of-type" : true,//*
  "left"         : false,
  "link"         : false,

  // Do not keep not(), because it's too complicated,
  // like :not(:focus) => :not(*) can't match anything.
  "not"              : false,
  "nth-child"        : true,//* // nth-child(2)
  "nth-last-child"   : true,//*
  "nth-last-of-type" : true,//*
  "nth-of-type"      : true,//*

  "only-child"   : true,//*
  "only-of-type" : true,//*
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
  "where"   : true, //*
};


// Pseudo-elements
//   @see MDN/en-US/docs/Web/CSS/Pseudo-elements
//
//  currently(2021.12.21)
//  querySelector() with pseudo-emements will not matche any element.
//
//  name => keep
const PSEUDO_ELEMENTS_DICT = {
  "before"               : false,
  "after"                : false,
  "backdrop"             : false,
  "cue"                  : false,
  "cue-region"           : false,
  "first-letter"         : false, // *
  "first-line"           : false, // *
  "file-selector-button" : false,
  "grammar-error"        : false, // *
  "marker"               : false,
  "part"                 : false, // *
  "placeholder"          : false,
  "selection"            : false,
  "-moz-selection"       : false,
  "slotted"              : false, // *
  "spelling-error"       : false, // *
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
function simplify(selectorText) {
  return editSelectorText(selectorText, attrModifier, pseudoModifier);
}


function attrModifier({currPart, isLastPart, attrName, attrOperator, attrValue, attrSuffix}) {
  if (ATTR_WHITELIST.has(attrName)) {
    return (currPart ? '' : (isLastPart ? '*' : ''));
  } else {
    // render attribute
    const r = [attrName];
    if (attrOperator && attrValue) {
      r.push(attrOperator);
      r.push(attrValue);
    }
    if (attrSuffix) {
      r.push(' ' + attrSuffix)
    }
    return "[" + r.join('') + "]";
  }
}

function pseudoModifier({currPart, isLastPart, pseudoType, pseudoName, pseudoArgsStr}) {
  if (keepPseudo(pseudoType, pseudoName)) {
    if (pseudoArgsStr) {
      return renderPseudo(pseudoType, pseudoName, simplify(pseudoArgsStr));
    } else {
      return renderPseudo(pseudoType, pseudoName);
    }
  } else {
    return (currPart ? '' : (isLastPart ? '*' : ''));
  }
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
// Basic Selector
//
//   Universal selector
//     `*`, `ns|*`, `*|*`
//
//   Type selector
//     `elementname`
//
//   Class selector
//     `.classname`
//
//   ID selector
//     `#idname`
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
//   * [attr operator value suffixMode]
//
// Pseudoes
//
//   pseudoClasses(:*)
//   pseudoElements(::*)
//
// Grouping:
//   `,`
//
//
// Combinators:
//   ` `, `>`, `~`, `+`, `||`
//

const [ATTR_UNKNOW, ATTR_NAME, ATTR_VALUE, ATTR_SUFFIX] = [0, 1, 2, 3];
const [PSEUDO_UNKNOWN, PSEUDO_KLASS, PSEUDO_ELEMENT] = [0, 1, 2];
const [OUTSIDE, INSIDE_BASIC, INSIDE_ATTR, INSIDE_PSEUDO] = [1, 2, 3, 4];

// leftChar => rightChar
const DICT = {'(' : ')', '[': ']', '"': '"', "'": "'"};

function editSelectorText(selectorText, attrModifier, pseudoModifier) {
  const removeNamespace = true;
  let pointer = OUTSIDE;

  let basicSelector = '';
  let basicSelectorAdded = false;

  let attrPointer = ATTR_UNKNOW;
  let attrName     = '';
  let attrOperator = '';
  let attrValue    = '';
  let attrSuffix   = '';

  let pseudoType = PSEUDO_UNKNOWN;
  let pseudoName = '';
  let pseudoArgsStr = '';

  // stack, push direction: left to right;
  let leftChars = [];

  // store str of current selector
  let currPart = '';
  let result = '';

  const len = selectorText.length;

  for (let i = 0; i < len; i++) {
    const ch = selectorText[i];

    // outside selector
    if (pointer == OUTSIDE) {
      switch(ch) {
        case ' ':
        case '\t':
        case '\n':
        case ',':
        case '>':
        case '~':
        case '+':
        case '|': {
          // in the middle of two selectors
          result += ch;
          break;
        }
        case ':': {
          pointer = INSIDE_PSEUDO;
          // step back one index, so the other branch of code
          // can identify it as a pseudo.
          i--;
          break;
        }
        case '[': {
          // attribute
          pointer = INSIDE_ATTR;
          i--; // step back
          break;
        }
        default: {
          pointer = INSIDE_BASIC;
          basicSelector += ch;
          break;
        }
      }
      continue;
    }


    // =========================================================
    // handle basic selector
    // =========================================================

    if (pointer == INSIDE_BASIC) {
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
          pointer = OUTSIDE;
          basicSelectorAdded = false;
          break;
        }
        case ':': {
          pointer = INSIDE_PSEUDO;
          i--; // step back
          break;
        }
        case '[': {
          pointer = INSIDE_ATTR;
          i--; // step back
          break;
        }
        case '|': {
          if (i + 1 < len) {
            const nextChar = selectorText[i + 1];
            if (nextChar === ch) {
              // is `||` (column combinator)
              result += `${basicSelector}${ch}`;
              basicSelector = '';
              pointer = OUTSIDE;
              basicSelectorAdded = false;
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
      continue;
    }

    // =========================================================
    // handle attribute selector
    // =========================================================
    if (pointer == INSIDE_ATTR) {
      // this is the begining of attribute
      if (ch == '[') {
        attrPointer = ATTR_NAME;
        if (!basicSelectorAdded) {
          result += basicSelector
          currPart += basicSelector;
          basicSelector = '';
          basicSelectorAdded = true;
        }
        continue;
      }

      if (leftChars.length == 0) {
        switch(ch) {
          case ']': {
            // end of attribute

            const nextIsAttr   = i + 1 < len && selectorText[i + 1] == '[';
            const nextIsPseudo = i + 1 < len && selectorText[i + 1] == ':';
            const isLastPart = !(nextIsAttr || nextIsPseudo);
            const it = attrModifier({currPart, isLastPart, attrName, attrOperator, attrValue, attrSuffix});

            result += it;
            if (isLastPart) {
              currPart = '';
              pointer = OUTSIDE;
              basicSelectorAdded = false;
            }

            if (nextIsAttr)   {currPart += it; pointer = INSIDE_ATTR}
            if (nextIsPseudo) {currPart += it; pointer = INSIDE_PSEUDO}

            attrPointer = ATTR_UNKNOW;
            attrName     = '';
            attrOperator = '';
            attrValue    = '';
            attrSuffix   = '';
            break;
          }
          case ' ': {
            if (attrPointer == ATTR_VALUE) {
              attrPointer = ATTR_SUFFIX;
            }
            break;
          }
          case '"':
          case "'": {
            leftChars.push(ch);
            if (attrOperator) {
              attrValue += ch;
            } else {
              throw new Error("Should not reach here, operator isn't exists");
            }
            break;
          }
          case '=': // [attr=value]
          case '~': // [attr~=value]
          case '|': // [attr|=value]
          case '^': // [attr^=value]
          case '$': // [attr$=value]
          case '*': // [attr*=value]
          {
            // is a operator
            if (ch !== '=') {
              if (i + 1 >= len) {
                throw new Error("Should not reach the end of selector text");
              }
              const nextCh = selectorText[i + 1];
              if (nextCh !== '=') {
                throw new Error(`Attribute selector invalid: expect "${ch}=" but got "${ch}${nextCh}"`);
              }
              attrOperator = ch + '=';
              i++; // skip next char;
            } else {
              attrOperator = ch;
            }
            attrPointer = ATTR_VALUE;
            break;
          }
          default: {
            if (attrPointer == ATTR_NAME)   {attrName   += ch; break}
            if (attrPointer == ATTR_VALUE)  {attrValue  += ch; break}
            if (attrPointer == ATTR_SUFFIX) {attrSuffix += ch; break}
          }
        }


      } else {
        // inside value String

        if ((ch == '"' || ch == "'") && leftChars[0] == ch) {
          leftChars.shift();
        }
        attrValue += ch;
      }

      continue;
    }

    // =========================================================
    // handle pseudo
    // =========================================================

    if (pointer == INSIDE_PSEUDO) {

      // this is the begining of pseudo
      if (ch == ':' && pseudoType == PSEUDO_UNKNOWN) {
        if (!basicSelectorAdded) {
          result += basicSelector
          currPart += basicSelector;
          basicSelector = '';
          basicSelectorAdded = true;
        }
        // Is next char a colon?
        if (i + 1 < len && selectorText[i + 1] == ':') {
          pseudoType = PSEUDO_ELEMENT;
          i = i + 1; // skip the next char.
        } else {
          pseudoType = PSEUDO_KLASS;
        }
        continue;
      }

      // collecting pseudo chars

      if (leftChars.length == 0) {
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
          case '[':
          case ':' : {
            // end of current pseudo.
            let isLastPart = true;
            if (ch == ':') {
              isLastPart = false;
              const it = pseudoModifier({currPart, isLastPart, pseudoType, pseudoName});
              currPart += it;
              result   += it;
              pointer = INSIDE_PSEUDO;
              i--; // step back
            } else if (ch == '[') {
              isLastPart = false;
              const it = pseudoModifier({currPart, isLastPart, pseudoType, pseudoName});
              currPart += it;
              result   += it;
              pointer = INSIDE_ATTR;
              i--; // step back
            } else {
              result += pseudoModifier({currPart, isLastPart, pseudoType, pseudoName});
              result += ch;
              pointer = OUTSIDE;
              currPart = '';
              basicSelectorAdded = false;
            }
            pseudoType = PSEUDO_UNKNOWN;
            pseudoName = '';
            break;
          }
          default: {
            pseudoName += ch;
            break;
          }
        }
        continue;


      } else {
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
                // stack is empty, reach the end of arguments
                const nextIsAttr   = (i + 1 < len && selectorText[i + 1] == '[');
                const nextIsPseudo = (i + 1 < len && selectorText[i + 1] == ':');
                const isLastPart = !(nextIsAttr || nextIsPseudo);

                const it = pseudoModifier({currPart, isLastPart, pseudoType, pseudoName, pseudoArgsStr});

                result += it;
                if (isLastPart) {
                  currPart = '';
                  basicSelectorAdded = false;
                  pointer = OUTSIDE;
                }

                if (nextIsAttr)   {currPart += it; pointer = INSIDE_ATTR}
                if (nextIsPseudo) {currPart += it; pointer = INSIDE_PSEUDO}

                pseudoType = PSEUDO_UNKNOWN;
                pseudoName = '';
                pseudoArgsStr = '';

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
        continue;
      }

    }

  }

  // reach the end.

  if (pointer == INSIDE_BASIC && basicSelector) {
    result += basicSelector;
    return result;
  }

  if (pointer == INSIDE_ATTR && attrName) {
    const isLastPart = true;
    result += attrModifier({currPart, isLastPart, attrName, attrOperator, attrValue, attrSuffix});
    return result;
  }

  if (pointer == INSIDE_PSEUDO && pseudoName) {
    const isLastPart = true;
    result += pseudoModifier({currPart, isLastPart, pseudoType, pseudoName});
  }

  return result;
}


class Matcher {
  /**
   * @param {Element|DocumentFragment(shadowRoot)|Document} contextNode
   *    contextNode must has querySelector() function,
   *    and optionally has matches() function.
   *
   */
  constructor(contextNode) {
    this._contextNode = contextNode;
    if (this._isRootNode(contextNode)) {
      this.nodesToMatch = [contextNode];
    } else {
      this.nodesToMatch = this._getSelectedNodeAndItsAncestors(contextNode);
    }
  }

  match(selectorText = "") {

    if (selectorText === "") {
      // nothing to match, return true for safety
      return true;
    }

    const firstNode = this.nodesToMatch[0];
    let selectorTextArgInvalid = false;
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
      selectorTextArgInvalid = true;
    }

    // FIXME adding catch ?
    const simplifiedSelectorText = simplify(selectorText);

    if (simplifiedSelectorText === selectorText) {
      if (selectorTextArgInvalid) {
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

      if (selectorTextArgInvalid && simplifiedSelectorTextInvalid) {
        // both selector texts are invalid for querySelector() or matches();
        // We can't detect it, just return true for safety.
        //
        return true;
      }

      for (const node of this.nodesToMatch) {
        if (node.matches) {
          if ((!selectorTextArgInvalid) && node.matches(selectorText)) {
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

  _isRootNode(node) {
    return node.nodeType === NODE_TYPE.DOCUMENT || this._isShadowRoot(node);
  }

  _isShadowRoot(node) {
    return node.nodeType === NODE_TYPE.DOCUMENT_FRAGMENT && node.host;
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

      if ((!pNode) && this._isShadowRoot(currNode)) {
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
