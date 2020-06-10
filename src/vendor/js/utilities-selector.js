
// This file come from css-selector-generator@2.0.1/src/utilities-selector.js
// This js don't work well in test environment.
// There's some global variables that is not exist in node environment, like window, document.
// We should use the original file if this problem is fixed.

export const ESCAPED_COLON = ':'
  .charCodeAt(0)
  .toString(16)
  .toUpperCase();

export const SPECIAL_CHARACTERS_RE = /[ !"#$%&'()\[\]{|}<>*+,./;=?@^`~\\]/;


/**
 * Escapes special characters used by CSS selector items.
 * @param {string} input
 * @return {string}
 */
export function sanitizeSelectorItem (input = '') {
  return input.split('')
    .map((character) => {
      if (character === ':') {
        return `\\${ESCAPED_COLON} `;
      }
      if (SPECIAL_CHARACTERS_RE.test(character)) {
        return `\\${character}`;
      }
      return escape(character)
        .replace(/%/g, '\\');
    })
    .join('');
}
