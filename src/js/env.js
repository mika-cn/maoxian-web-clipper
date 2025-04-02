
const mdnRoot = "http://mdn.pc"
const websiteRoot = "http://mx.pc";
const projectRoot = "https://github.com/mika-cn/maoxian-web-clipper";
const mxAssistantRoot = [websiteRoot, 'tmp/assistant'].join('/');

const env = {
  isDev: true,
  logLevel: "debug",
  version: '0.7.76',
  minNativeAppVersion: '0.2.8',
  mdnRoot: mdnRoot,
  websiteRoot: websiteRoot,
  projectRoot: projectRoot,
  mxAssistantRoot: mxAssistantRoot,
};

export default env;
