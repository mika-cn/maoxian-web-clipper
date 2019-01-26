
"use strict";

/*
 * Query.find(items, q)
 * Query.search(items, q}
 * q: {
 *   _logic_: 'and' or 'or'
 *   attr: [matcherName, *args]
 * }
 */

var Query = (function(){

  function findObj(objs, q) {
    const [logic, matchers] = parseQ(q);
    if(matchers.length > 0){
      const fn = combine(logic, matchers);
      return [].find.call(objs, fn);
    } else {
      return undefined;
    }
  }

  function queryObj(objs, q) {
    const [logic, matchers] = parseQ(q);
    if(matchers.length > 0){
      const fn = combine(logic, matchers);
      return [].filter.call(objs, fn);
    } else {
      return objs;
    }
  }

  function combine(logic, matchers) {
    const isAnd = (logic === 'AND')
    return function(obj) {
      let currResult = isAnd;
      for(let i=0; i<matchers.length; i++) {
        const keepMatch = (isAnd ? currResult : !currResult);
        if(keepMatch) {
          const matcher = matchers[i];
          const value = obj[matcher.attr];
          const fn = Query.m[matcher.name];
          if(fn){
            currResult = fn(value, matcher.args);
          } else {
            throw new Error(`Unknow matcher name: ${matcher.name}`);
          }
        } else {
          break;
        }
      }
      return currResult;
    }
  }

  function parseQ(q) {
    const logic = q.__logic__ || 'AND';
    const matchers = [];
    let key = null;
    for(key in q) {
      if(key != '__logic__') {
        const args = q[key];
        const name = args.shift();
        matchers.push({
          attr: key,
          name: name,
          args: args
        });
      }
    }
    return [logic, matchers];
  }




  // matchers
  const m = {};
  m.equal = function(value, args) {
    return value === args[0];
  }
  m.match = function(value, args) {
    return value.match(args[0]);
  }
  m.between = function(value, args){
    const [from, to] = args.sort();
    return from <= value && value <= to;
  }
  m.memberInclude = function(value, args) {
    return value.includes(args[0]);
  }
  m.memberMatch = function(value, args) {
    return value.some(function(member) {
      return member.match(args[0]);
    });
  }

  const Lib = { findObj: findObj, queryObj: queryObj }
  Lib.m = m;
  return Lib;
})();
