;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcCapturer$Name = factory();
  }
})(this, function(T, undefined) {
  "use strict";

  /*!
   * Capture Element $Name
   */

  function capture(node, opts) {
    return {node, tasks};
  }


  return {capture: capture}
});
