;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcENV = factory();
  }
})(this, function(undefined) {
"use strict";

  return {
    logLevel: "warn",
    version: '0.1.39',
    minNativeAppVersion: '0.1.9'
  };
});
