
;(function() {
  let handlers = {};
  let state = {};
  function sendToBackground(msg) {
    const handler = handlers[msg.type];
    return handler(msg, state);
  }

  // handler should return a Promise
  function mock(msgType, handler) {
    handlers[msgType] = handler;
  }

  function mockDefault() {

    mock('keyStore.init', function(msg, state) {
      const key = msg.body.key;
      state.keys = state.keys || new Set();
    });

    mock('keyStore.add', function(msg, state) {
      const key = msg.body.key;
      state.keys = state.keys || new Set();
      const canAdd = !state.keys.has(key)
      state.keys.add(key);
      return Promise.resolve(canAdd);
    });
  }

  function clearMocks() {
    handlers = {};
    state = {};
    mockDefault();
  }

  mockDefault();

  module.exports = {
    sendToBackground: sendToBackground,
    mock: mock,
    clearMocks: clearMocks,
  }
})();
