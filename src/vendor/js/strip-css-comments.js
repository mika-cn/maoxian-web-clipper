// https://github.com/sindresorhus/strip-css-comments/blob/master/index.js
// hacked
//   remove preserveFilter
'use strict';
(function() {
 var stripCssComments = (input, options = {}) => {
  let preserveImportant = !(options.preserve === false || options.all === true);

  let isInsideString = false;
  let currentCharacter = '';
  let comment = '';
  let returnValue = '';

  for (let i = 0; i < input.length; i++) {
    currentCharacter = input[i];
    if (input[i - 1] !== '\\') {
      if (currentCharacter === '"' || currentCharacter === '\'') {
        if (isInsideString === currentCharacter) {
          isInsideString = false;
        } else if (!isInsideString) {
          isInsideString = currentCharacter;
        }
      }
    }

    // Find beginning of /* type comment
    if (!isInsideString && currentCharacter === '/' && input[i + 1] === '*') {
      // Ignore important comment when configured to preserve comments using important syntax: /*!
      const isImportantComment = input[i + 2] === '!';
      let j = i + 2;

      // Iterate over comment
      for (; j < input.length; j++) {
        // Find end of comment
        if (input[j] === '*' && input[j + 1] === '/') {
          // replace comment with one space to avoid situation like parta/*comment*/partb;
          if(preserveImportant && isImportantComment){
            returnValue += ('/*' + comment + '*/');
          }else{
            returnValue += " ";
          }
          comment = '';
          break;
        }
        comment += input[j];
      }

      // Resume iteration over CSS string from the end of the comment
      i = j + 1;
      continue;
    }

    returnValue += currentCharacter;
  }

  return returnValue;
};
(typeof module !== "undefined" && module !== null ? module.exports = stripCssComments : void 0) || (this.stripCssComments = stripCssComments);
}).call(this);
