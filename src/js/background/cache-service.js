;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(require('../lib/tool.js'));
  } else {
    // browser or other
    root.MxWcCacheService = factory(root.MxWcTool);
  }
})(this, function(T) {

  const cache = T.createDict();

  function findOrCache(key, action) {
    return new Promise((resolve, reject) => {
      if (cache.hasKey(key)) {
        const {type, result} = cache.find(key);
        const returnValue = {fromCache: true, result: result};

        if (type === 'resolve') {
          resolve(returnValue);
        } else {
          reject(returnValue);
        }
      } else {
        action().then(
          (result) => {
            const value = {type: 'resolve', result: result};
            cache.add(key, value);
            resolve({fromCache: false, result: result});
          },
          (result) => {
            const value = {type: 'reject', result: result};
            cache.add(key, value);
            reject({fromCache: false, result: result});
          }
        );
      }
    });
  }

  function removeByKeyPrefix(keyPrefix) {
    cache.removeByKeyPrefix(keyPrefix);
  }

  return {
    findOrCache: findOrCache,
    removeByKeyPrefix: removeByKeyPrefix,
  }

});
