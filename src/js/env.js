

const websiteRoot = "http://dev.pc:3000/maoxian-web-clipper";
const projectRoot = "https://github.com/mika-cn/maoxian-web-clipper";
const mxAssistantRoot = [websiteRoot, 'tmp/assistant'].join('/');

const env = {
  isDev: true,
  logLevel: "debug",
  version: '0.1.72',
  minNativeAppVersion: '0.2.2',
  websiteRoot: websiteRoot,
  projectRoot: projectRoot,
  mxAssistantRoot: mxAssistantRoot,
};

export default env;
