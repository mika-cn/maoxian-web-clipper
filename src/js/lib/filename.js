
/*
 * Based on sanitize-filename(1.6.3)
 *
 */
// @see https://stackoverflow.com/questions/1976007/what-characters-are-forbidden-in-windows-and-linux-directory-names#1976050
// @see https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file


import truncateUtf8Bytes from '../../vendor/truncate-utf8-bytes/index.js'


// @param {String} name - name should not contains file extension.
function sanitize(name) {

  if (typeof name !== 'string') {
    throw new Error("Filename must be string");
  }

  // Unicode Control codes
  // 0x00-0x1f and 0x80-0x9f
  const regExp_unicodeControlCode = /[\x00-\x1f\x80-\x9f]/g

  // remove "\s" "\." ","
  // Illegal characters on most file systems.
  //   "/", "?", "|", "<", ">", "\", ":", "*", '"'
  const regExp_illegalChars = /[\/\?\|<>\\:\*"]/g

  // Reserved names in Windows: 'CON', 'PRN', 'AUX', 'NUL',
  // 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
  // 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
  // case-insesitively and with or without filename extensions.
  const regExp_winReservedNames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

  // <space> and "." are not allowed in the end (in the Windows).
  const regExp_winTrailingChars = /[ \.]$/;


  // Reserved names in Unix liked OS
  // ".", ".."
  const regExp_UnixLikedReservedNames = /^\.+$/;

  // clear name string.
  const input = name.trim().replace(regExp_unicodeControlCode, '');

  if (input.match(regExp_winReservedNames) || input.match(regExp_UnixLikedReservedNames)) {
    return generateName();
  }

  // separator
  const s = '-';
  let result = input.replace(regExp_illegalChars, s).replace(regExp_winTrailingChars, s);
  result = removeZeroWidthCharacters(result)
  result = replaceSymbols(result);

  result = (result === '' ? generateName() : result);

  // The length limit of filename (include file extension) is 255 bytes
  // But we only sanitize name (exclude file extension) here,
  // In order to stay inside limit,
  // we keep some space to file extension, prefix and suffix.
  // that's why we use a smaller limit here.
  return truncateUtf8Bytes(result, 200);
}


function removeZeroWidthCharacters(input) {
  return input.replace(/[\u200B\u2060]/g, '')
}


function replaceSymbols(input) {
  const s = '-'
  let result = input.replace(new RegExp('`', 'g'), s);
  // remember conflict values
  const conflicts = [ /c\+\+/ig ];
  const idxTool = createIdxTool();
  const conflictValues = [];

  conflicts.forEach((regExp) => {
    result = result.replace(regExp, (match) => {
      conflictValues.push(match);
      return "`" + idxTool.next() + "`";
    })
  })

  // avoid ugly filename :)
  result = result.replace(/\s/g, s)
    .replace(/,/g, s)
    .replace(/\./g, s)
    .replace(/'/g, s)
    .replace(/#/g, s)
    .replace(/@/g, s)
    .replace(/~/g, s)
    .replace(/!/g, s)
    .replace(/%/g, s)
    .replace(/&/g, s)
    .replace(/\+/g, s)
    .replace(/\?/g, s)
    .replace(/\[/g, s)
    .replace(/\]/g, s)
    .replace(/\(/g, s)
    .replace(/\)/g, s)
    .replace(/\{/g, s)
    .replace(/\}/g, s)

    .replace(/：/g, s)
    .replace(/‘/g, s)
    .replace(/’/g, s)
    .replace(/“/g, s)
    .replace(/”/g, s)
    .replace(/，/g, s)
    .replace(/。/g, s)
    .replace(/！/g, s)
    .replace(/？/g, s)
    .replace(/《/g, s)
    .replace(/》/g, s)
    .replace(/〈/g, s)
    .replace(/〉/g, s)
    .replace(/«/g, s)
    .replace(/»/g, s)
    .replace(/‹/g, s)
    .replace(/›/g, s)
    .replace(/（/g, s)
    .replace(/）/g, s)
    .replace(/「/g, s)
    .replace(/」/g, s)
    .replace(/【/g, s)
    .replace(/】/g, s)
    .replace(/〔/g, s)
    .replace(/〕/g, s)
    .replace(/［/g, s)
    .replace(/］/g, s)

    .replace(/-+/g, s) // multiple dash to one dash
    .replace(/^-/, '') // delete dash at the beginning
    .replace(/-$/, ''); // delete dash at the end

  // replace back conflict values
  result = result.replace(/`(\d+)`/g, (match, idx) => {
    return conflictValues[parseInt(idx)];
  });

  return result;
}


function generateName() {
  return ["invalid-filename", Math.round(Math.random() * 10000)].join('-');
}


function createIdxTool(start) {
  return {
    idx: (start || -1),
    next: function() {
      return ++this.idx;
    }
  }
}

export default {sanitize}
