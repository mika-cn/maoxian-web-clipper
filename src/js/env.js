

const websiteRoot = "http://dev.pc:3000/maoxian-web-clipper";
const projectRoot = "https://github.com/mika-cn/maoxian-web-clipper";
const mxAssistantRoot = [websiteRoot, 'tmp/assistant'].join('/');

const env = {
  isDev: true,
  logLevel: "debug",
  version: '0.4.0',
  minNativeAppVersion: '0.2.8',
  websiteRoot: websiteRoot,
  projectRoot: projectRoot,
  mxAssistantRoot: mxAssistantRoot,
};

export default env;
