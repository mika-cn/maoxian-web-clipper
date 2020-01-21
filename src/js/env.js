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

  const websiteRoot = "http://dev.pc:3000/maoxian-web-clipper";
  const projectRoot = "https://github.com/mika-cn/maoxian-web-clipper";
  const mxAssistantRoot = [websiteRoot, 'tmp/assistant'].join('/');

  return {
    logLevel: "debug",
    version: '0.1.48',
    minNativeAppVersion: '0.2.2',
    websiteRoot: websiteRoot,
    projectRoot: projectRoot,
    mxAssistantRoot: mxAssistantRoot,
  };
});
