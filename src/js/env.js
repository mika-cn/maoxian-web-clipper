  "use strict";

  const websiteRoot = "http://dev.pc:3000/maoxian-web-clipper";
  const projectRoot = "https://github.com/mika-cn/maoxian-web-clipper";
  const mxAssistantRoot = [websiteRoot, 'tmp/assistant'].join('/');

  const env = {
    logLevel: "debug",
    version: '0.1.54',
    minNativeAppVersion: '0.2.2',
    websiteRoot: websiteRoot,
    projectRoot: projectRoot,
    mxAssistantRoot: mxAssistantRoot,
  };

  export default env;