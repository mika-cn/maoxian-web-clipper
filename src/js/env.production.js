
const mdnRoot = "https://developer.mozilla.org"
const websiteRoot = "https://mika-cn.github.io/maoxian-web-clipper";
const projectRoot = "https://github.com/mika-cn/maoxian-web-clipper";
const mxAssistantRoot = [websiteRoot, 'assistant'].join('/');

const env = {
  isDev: false,
  logLevel: "warn",
  version: '0.7.78',
  minNativeAppVersion: '0.2.8',
  mdnRoot: mdnRoot,
  websiteRoot: websiteRoot,
  projectRoot: projectRoot,
  mxAssistantRoot: mxAssistantRoot,
};

export default env;
