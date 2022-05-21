

const websiteRoot = "https://mika-cn.github.io/maoxian-web-clipper";
const projectRoot = "https://github.com/mika-cn/maoxian-web-clipper";
const mxAssistantRoot = [websiteRoot, 'assistant'].join('/');

const env = {
  isDev: false,
  logLevel: "warn",
  version: '0.4.7',
  minNativeAppVersion: '0.2.8',
  websiteRoot: websiteRoot,
  projectRoot: projectRoot,
  mxAssistantRoot: mxAssistantRoot,
};

export default env;
