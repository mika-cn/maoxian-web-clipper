
;(function() {
  let handlers = {};
  let state = {};

  function initBrowser(browser) {
    if (!state.browser) { state.browser = browser; }
    state.browser.runtime.sendMessage.callsFake(sendMessage);
  }

  function sendMessage(msg) {
    const handler = handlers[msg.type];
    if (handler) {
      return handler(msg, state);
    } else {
      throw "Unknow message type: " + msg.type;
    }
  }

  // handler should return a Promise
  function mock(msgType, handler) {
    handlers[msgType] = handler;
  }

  function mockFetchTextStatic(text, fromCache=false) {
    mock('fetch.text', (msg, state) => {
      const key = [msg.body.clipId, msg.body.url].join('.');
      state.keys = state.keys || {};
      let result = state.keys[key];
      if (result) {
        return Promise.resolve({fromCache: true, result: result});
      } else {
        result = text;
        state.keys[key] = result;
        return Promise.resolve({fromCache: false, result: result});
      }
    })
  }

  function mockFetchTextUrls(textObj) {
    mock('fetch.text', (msg, state) => {
      const key = [msg.body.clipId, msg.body.url].join('.');
      state.keys = state.keys || {};
      let result = state.keys[key];
      if (result) {
        return Promise.resolve({fromCache: true, result: result});
      } else {
        result = textObj[msg.body.url];
        state.keys[key] = result;
        return Promise.resolve({fromCache: false, result: result});
      }
    })
  }

  function mockFrameToHtmlStatic(result, fromCache=false) {
    mock('frame.toHtml', (msg, state) => {
      return Promise.resolve({fromCache: fromCache, result: result});
    });
  }

  function mockFrameMsgUrls(type, textObj) {
    mock(type, (msg, state) => {
      const key = [msg.body.clipId, msg.frameUrl].join('.');
      state.keys = state.keys || {};
      let result = state.keys[key];
      if (result) {
        return Promise.resolve({fromCache: true, result: result});
      } else {
        result = textObj[msg.frameUrl];
        state.keys[key] = result;
        return Promise.resolve({fromCache: false, result: result});
      }
    });
  }

  function mockMsgResult(type, result, isResolved = true) {
    mock(type, (msg, state) => {
      if (isResolved) {
        return Promise.resolve(result);
      } else {
        return Promise.reject(result);
      }
    });
  }


  function clearMocks() {
    handlers = {};
    state = {};
  }

  module.exports = {
    initBrowser,
    clearMocks,
    mockMsgResult,
    mockFetchTextStatic,
    mockFetchTextUrls,
    mockFrameToHtmlStatic,
    mockFrameMsgUrls,
  }
})();
