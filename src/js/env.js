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
    logLevel: "debug",
    version: '0.1.41',
    minNativeAppVersion: '0.1.9'
  };
});
