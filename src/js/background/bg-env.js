;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcBgEnv = factory();
  }
})(this, function(undefined) {
  "use strict";
  const env = {};

  env.requestToken = ['', Date.now(),
    Math.round(Math.random() * 10000)
  ].join('');

  return env;
});
