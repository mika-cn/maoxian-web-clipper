
const assert = require('assert');

function depJs(path) {
  return require(`../src/js/${path}`);
}

function depMockJs(path) {
  return require(`./mock/${path}`);
}

function assertEqual(actual, expected) {
  assert.strictEqual(actual, expected);
}

function assertNotEqual(actual, expected) {
  if (actual !== expected) {
    assert(true);
  } else {
    assert.fail(`${actual}(actual) is not expected to equal ${expected}`);
  }
}

function assertMatch(value, regExp) {
  if (value.match(regExp)) {
    assert(true);
  } else {
    assert.fail(`${value} is not match ${regExp}`);
  }
}

function assertNotMatch(value, regExp) {
  if (value.match(regExp)) {
    assert.fail(`${value} is not expected to match ${regExp}`);
  } else {
    assert(true);
  }
}

function assertTure(value) {
  if (value === true) {
    assert(true);
  } else {
    assert.fail(`${value} is not true`);
  }
}

function assertFalse(value) {
  if (value === false) {
    assert(true);
  } else {
    assert.fail(`${value} is not false`);
  }
}

function assertThrowError(fn) {
  try {
    fn();
  } catch(e) {
    assert(true);
    return;
  }
  assert.fail("It should throw an Error, But it didn't");
}

async function assertResolve(promise, validate) {
  return promise.then(
    (value) => {validate(value)},
    () => {
      assert.fail(`Expecting promise to be resolved but it was rejected`);
    }
  );
}

function assertReject(promise, validate) {
  return promise.then(
    () => {
      assert.fail(`Expecting promise to be rejected but it was resolved`);
    },
    (value) => {validate(value)}
  );
}

module.exports = {
  depJs: depJs,
  depMockJs: depMockJs,

  /* asserts */
  assertEqual: assertEqual,
  assertNotEqual: assertNotEqual,
  assertMatch: assertMatch,
  assertNotMatch: assertNotMatch,
  assertTrue: assertTure,
  assertFalse: assertFalse,
  assertThrowError: assertThrowError,
  assertResolve: assertResolve,
  assertReject: assertReject,
};
