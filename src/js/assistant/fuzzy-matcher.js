/*
 * FuzzyMatcher
 */

"use strict";

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

function matchPath(path, pattern) {
  const names = splitAndSanitizeInput(path);
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

function matchUrl(url, pattern){
  try {
    const str = url.split('?')[0].split('#')[0];
    return matchPath(str, pattern);
  } catch(e) {
    const msg = ["url", url, "pattern", pattern].join(': ');
    console.error(msg);
    //console.error(e);
    throw e;
  }
}

const FuzzyMatcher = {matchUrl: matchUrl}

export default FuzzyMatcher;
