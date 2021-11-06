
import assert from 'assert';

function wrapCapturer(Capturer) {
  return {
    capture(node, params) {
      const r = Capturer.capture(node, params);
      return {tasks: r.tasks, change: r.change.toChangeObjectAccessor()};
    }
  }
}

function wrapAsyncCapturer(Capturer) {
  return {
    capture: async function(node, params) {
      const r = await Capturer.capture(node, params);
      return {tasks: r.tasks, change: r.change.toChangeObjectAccessor()};
    }
  }
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

function assertTrue(value) {
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

export default {
  wrapCapturer,
  wrapAsyncCapturer,

  /* asserts */
  assertEqual,
  assertNotEqual,
  assertMatch,
  assertNotMatch,
  assertTrue,
  assertFalse,
  assertThrowError,
  assertResolve,
  assertReject,
};
