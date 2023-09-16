
let responses = {};

function mockFetch(url, resp) {
  responses[url] = resp;
  global.window = {fetch};
}

function fetch(url) {
  if (responses[url]) {
    return Promise.resolve(responses[url])
  } else {
    return Promise.reject('There is not response defined for url' + url);
  }
}

function mockFetchBlob(url, blob) {
  const resp = {
    blob() { return Promise.resolve(blob) }
  };
  mockFetch(url, resp);
}

function clearMocks() {
  responses = {};
  global.window = undefined;
}

export default {
  mockFetchBlob,
  clearMocks,
}
