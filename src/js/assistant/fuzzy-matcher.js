/*
 * FuzzyMatcher
 */

import T from '../lib/tool.js';


function matchText(str, pattern) {
  if(str!= '' && !str || pattern != '' && !pattern){
    throw new Error(["Invalid args", "str:", str, "pattern: ", pattern].join(' '));
  }
  const starts = pattern.match(/\*/g)
  if(starts && starts.length > 1) {
    const msg = "Pattern is not supported: " + pattern;
    throw new Error(msg);
  }
  const idx = pattern.indexOf('*');
  if(idx > -1) {
    if(pattern.length == 1) {
      return true;
    } else {
      switch(idx){
        case 0 :
          return str.endsWith(pattern.replace('*', ''));
        case pattern.length - 1 :
          return str.startsWith(pattern.replace('*', ''));
        default:
          const [startPart, endPart] = pattern.split('*');
          return str.startsWith(startPart) && str.endsWith(endPart);
      }
    }
  } else {
    return str === pattern;
  }
}

function matchAddress(address, pattern) {
  const names = splitAndSanitizeInput(address);
  const subPtns = splitAndSanitizeInput(pattern);
  return matchTwoCollection(names, subPtns);
}

function splitAndSanitizeInput(input) {
  const arr = input.replace("\\", '/').trim().split(/\/+/);
  const rmHead = arr.length > 0 && arr[0] === '';
  const rmEnd  = arr.length > 1 && arr[arr.length - 1] === '';
  if(rmHead) { arr.shift(); }
  if(rmEnd) {arr.pop(); }
  return arr;
}

function matchTwoCollection(names, subPtns) {
  if(names.length == 0) {
    return (
      // Exactly match.
      subPtns.length === 0 ||
      // Only '**' left.
      subPtns.length === 1 && subPtns[0] === '**'
    );
  }

  if(subPtns.length === 0) {
    // still have names
    return true;
  }

  const subPtn = subPtns.shift();
  let match = false;
  if(subPtn === '**') {
    let nextPtn = undefined;
    // Try to find next pattern that is not "*" or "**"
    // If nextPtn is "*" and not the last pattern, it swallow a name
    while(!nextPtn || nextPtn === '*' || nextPtn === '**') {

      if(names.length === 0) { break; }

      if(subPtns.length > 0) {
        nextPtn = subPtns.shift();
        if(nextPtn == '*') { names.shift()}
      } else if(['*', '**'].indexOf(nextPtn) > -1) {
        // nextPtn is the last subPtn.
        // And all the way is '*' and '**'
        // swallow everything
        return true;
      } else {
        // nextPtn is undefined
        break;
      }

    }

    if(nextPtn && nextPtn != '**') {
      if(nextPtn == '*') {
        // names is []
        return matchTwoCollection(names, subPtns)
      } else {
        while(names.length > 0) {
          const name = names.shift();
          if(matchText(name, nextPtn)) {
            match = true;
            break;
          }
        }
      }
    } else {
      // subPtn is '**' and it's the last one.
      // case 1: subPth is '**' and nextPtn is undefined.
      // case 2: subPth is '**' and nextPtn is '**'
      // It swallow everything
      return true;
    }
  } else {
    const name = names.shift();
    match = matchText(name, subPtn);
  }
  if(match) {
    return matchTwoCollection(names, subPtns);
  } else {
    return false;
  }
}


function matchSearch(search, pattern) {
  if (!pattern) { return true }
  if (!search) { return false }
  const isStrictMode = pattern.startsWith('!');
  const searchItems = parseSearch(search);
  const patternItems = parseSearch(isStrictMode ? pattern.substring(1) : pattern);
  const restrictOK = isStrictMode ? searchItems.length == patternItems.length : true;
  return restrictOK && T.all(patternItems, ([namePtn, valuePtn]) => {
    return searchItems.some(([name, value]) => {
      return name == namePtn && matchText(value, valuePtn);
    });
  });
}



function matchFrame(frame, pattern) {
  if (!pattern) { return true }
  if (!frame) { return false }
  return matchText(frame, pattern);
}


function matchUrl(url, pattern){
  try {
    if (url === pattern) { return true }
    const urlObj = parseUrl(url);
    const ptnObj = parseUrl(pattern);
    return (
         matchText(urlObj.scheme, ptnObj.scheme)
      && matchAddress(urlObj.address, ptnObj.address)
      && matchSearch(urlObj.search, ptnObj.search)
      && matchFrame(urlObj.frame, ptnObj.frame)
    );
  } catch(e) {
    const msg = ["url", url, "pattern", pattern].join(': ');
    console.error(msg);
    //console.error(e);
    throw e;
  }
}


// only supports http:// https:// file://
function parseUrl(input) {
  let scheme, address, search, frame, rest;
  // sanitize
  rest = input.replace("\\", '/').trim();

  splitToTwoParts(rest, '://', false, (head, tail) => {
    scheme = head;
    rest = tail;
  });

  splitToTwoParts(rest, '?', false, (head, tail) => {
    address = head;
    rest = tail;
  });

  splitToTwoParts(rest, '#', true, (head, tail) => {
    frame = tail;
    if (address) {
      search = head;
    } else {
      address = head;
    }
    rest = null;
  });

  if (rest) {
    if (address) {
      search = rest;
    } else {
      address = rest;
    }
  }

  return {scheme, address, search, frame};
}


function parseSearch(search) {
  return search.split('&').reduce((querys, item) => {
    splitToTwoParts(item, '=', false, (key, value) => {
      querys.push([key, value]);
    });
    return querys;
  }, []);
}


function splitToTwoParts(str, sep, reverse, callback) {
  const idx = reverse ? str.lastIndexOf(sep) : str.indexOf(sep);
  if (idx > -1) {
    const head = str.substring(0, idx);
    const tail = str.substring(idx + sep.length);
    callback(head, tail);
  }
}

const FuzzyMatcher = {matchUrl: matchUrl}

export default FuzzyMatcher;
