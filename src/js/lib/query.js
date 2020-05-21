"use strict";

/*!
 * Usage:
 *
 * Query.findObjByQ(objs, q)
 * Query.queryObjByQ(objs, q}
 * Query.q2Filter(q)
 * Query.combineFilter(logic, filterA, filterB)
 * Query.queryObjByFilter(objs, filter)
 *
 * q: {
 *   _logic_: 'and' or 'or'
 *   attr: [matcherName, *args]
 * }
 */

function findObjByQ(objs, q) {
  const filter = q2Filter(q);
  if (filter.avoidable){
    // q doesn't define any matchers.
    return undefined;
  } else {
    return [].find.call(objs, filter.fn);
  }
}

function queryObjByQ(objs, q) {
  const filter = q2Filter(q);
  return queryObjByFilter(objs, filter);
}

function queryObjByFilter(objs, filter) {
  if (filter.avoidable){
    return objs;
  } else {
    return [].filter.call(objs, filter.fn);
  }
}


function combineFilter(logic, filterA, filterB) {
  if (!filterA.avoidable && !filterB.avoidable) {
    const fn = combineBoolFns(logic, filterA.fn, filterB.fn);
    return {avoidable: false, fn: fn};
  }
  if(!filterA.avoidable) {
    return {avoidable: false, fn: filterA.fn};
  }
  if(!filterB.avoidable) {
    return {avoidable: false, fn: filterB.fn};
  }
  return getAvoidableFilter();
}


/**
 * @param {Object} q
 * @return {Object} filter
 *   avoidable: {boolean}
 *   fn: {Function}
 */
function q2Filter(q) {
  const [logic, matchers] = parseQ(q);
  if (matchers.length > 0) {
    const fn = combineBoolFns(logic, ...matchers);
    return {avoidable: false, fn: fn}
  } else {
    return getAvoidableFilter();
  }
}

function getAvoidableFilter() {
  return {
    avoidable: true,
    fn: function(obj) {
      throw new Error("You can avoid to execute this function");
    }
  }
}


function combineBoolFns(logic, ...fns) {
  if (fns.length === 0) {
    throw new Error("Not functions are provided.");
  }
  const isAnd = (logic === 'AND');
  return function(...args) {
    let currResult = isAnd;
    for (let i = 0; i < fns.length; i++) {
      const keepMatch = (isAnd ? currResult : !currResult);
      if (keepMatch) {
        currResult = fns[i](...args);
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
      const matchFn = m[name];

      if(matchFn) {

        const fn = (function(attr, matchFn, args) {
          return function(obj) {
            const value = obj[attr];
            return matchFn(value, args);
          }
        })(key, matchFn, args);

        matchers.push(fn);
      } else {
        throw new Error(`Unknow matchFn name: ${name}`);
      }
    }
  }
  return [logic, matchers];
}




// match functions
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

const Query = {
  findObjByQ: findObjByQ,
  queryObjByQ: queryObjByQ,
  queryObjByFilter: queryObjByFilter,
  q2Filter: q2Filter,
  combineFilter: combineFilter,
}

export default Query;
