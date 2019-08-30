;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('../lib/tool.js')
    );
  } else {
    // browser or other
    root.MxWcCapturerA = factory(
      root.MxWcTool
    );
  }
})(this, function(T, undefined) {
  "use strict";

  /*!
   * Capture Element <a>
   */


  /**
   * @param {Object} opts
   *   - {String} baseUrl
   *   - {String} docUrl
   *
   */
  function capture(node, opts) {
    const {baseUrl, docUrl} = opts;
    const href = node.getAttribute('href');
    const {isValid, url, message} = T.completeUrl(href, baseUrl);
    const tasks = [];

    let newHref = href;
    if (isValid) {
      newHref = T.url2Anchor(url, docUrl);
    } else {
      node.setAttribute('data-mx-warn', message);
      return {node, tasks};
    }

    node.setAttribute('href', newHref);
    node.removeAttribute('ping');

    if (!newHref.match(/^#/)) {
      // not anchor link (fragment link)
      node.setAttribute('target', '_blank');
      node.setAttribute('referrerpolicy', 'no-referrer');
      node.setAttribute('rel', 'noopener noreferrer');
    }
    return {node, tasks};
  }

  return {capture: capture}
});
