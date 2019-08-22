;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    const process = require('process');
    if (process.env.MX_WC_TESTING) {
      module.exports = factory;
    } else {
      module.exports = factory(
        require('./css.js')
      );
    }
  } else {
    // browser or other
    root.MxWcCapturerStyle = factory(
      root.MxWcCapturerCss,
    );
  }
})(this, function(CapturerCss, undefined) {
  "use strict";

  /*!
   * Capture Element <style>
   */

  /**
   * @param {Object} opts
   *   - {String} baseUrl
   *   - {String} docUrl
   *   - {Object} storageInfo
   *   - {String} clipId
   *   - {Object} mimeTypeDict
   *   - {Object} config
   *
   */
  async function capture(node, opts) {
    node.removeAttribute('nonce');
    const text = node.textContent;
    const {cssText, tasks} = await CapturerCss.captureText(Object.assign({ text: text }, opts));
    node.textContent = cssText;
    return {node, tasks};
  }


  return {capture: capture}
});
