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

  const websiteRoot = "https://mika-cn.github.io/maoxian-web-clipper";
  const projectRoot = "https://github.com/mika-cn/maoxian-web-clipper";
  const mxAssistantRoot = [websiteRoot, 'assistant'].join('/');

  return {
    logLevel: "warn",
    version: '0.1.48',
    minNativeAppVersion: '0.2.2',
    websiteRoot: websiteRoot,
    projectRoot: projectRoot,
    mxAssistantRoot: mxAssistantRoot,
  };
});
