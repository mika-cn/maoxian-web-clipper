  "use strict";

  import CapturerCss from './css.js';

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


  const CapturerStyle = {capture: capture}

  export default CapturerStyle;