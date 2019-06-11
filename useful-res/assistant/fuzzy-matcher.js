/*
 * FuzzyMatcher
 */

//=META version 0.0.1

const FuzzyMatcher = (function() {
  "use strict";

  function matchText(str, pattern) {
    if(!str || !pattern){
      throw new Error("Invalid args");
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
    const names = path.replace("\\", '/').trim().split(/\/+/);
    const subPtns = pattern.replace("\\", '/').trim().split(/\/+/);
    return matchTwoCollection(names, subPtns);
  }

  function matchTwoCollection(names, subPtns) {
    if(names.length == 0) {
      return (
        subPtns.length === 0 ||
        subPtns.length === 1 && subPtns[0] == '**'
      );
    }
    if(subPtns.length === 0) {
      return names.length === 0;
    }
    const subPtn = subPtns.shift();
    let match = false;
    if(subPtn === '**') {
      let nextPtn = undefined;
      while(!nextPtn || nextPtn == '*') {
        // find next not '*' pattern
        if(subPtns.length === 0 || names.length === 0) {
          break;
        }
        nextPtn = subPtns.shift();
        if(nextPtn == '*') {
          names.shift();
        }
      }
      if(nextPtn) {
        if(nextPtn == '*') { // last patten is '*'
          // subPtnsLen == 0 && namesLen == 0 true
          // subPtnsLen == 0 && namesLen > 0  true
          // subPtnsLen != 0 && namesLen == 0 false
          // subPtnsLen != 0 && namesLen > 0  impossible
          return subPtns.length === 0;
        } else {
          while(names.length > 0) {
            const name = names.shift();
            //console.log(name, nextPtn);
            if(matchText(name, nextPtn)) {
              match = true;
              break;
            }
          }
        }
      } else {
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
    const str = url.split('?')[0].split('#')[0];
    return matchPath(str, pattern);
  }

  //return {H: matchText, H2: matchPath, H3: matchUrl}
  return {
    matchText: matchText,
    matchPath: matchPath,
    matchUrl: matchUrl
  }
})();

