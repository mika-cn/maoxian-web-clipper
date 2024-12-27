import common from './common.js';

const values = {
  "tab.not-found": "We can't get the current active tab, you can focus the target tab and try again",
  "tab.not-http": "Target tab (id: ${id} title: ${title}, url: ${url}) is not a http tab",
  "tab.discarded": "Target tab (id: ${id} title: ${title}, url: ${url}) is discarded (content has been unloaded by browser), you can focus it to load it, and try again",
  "tab.in-reader-mode": "Target tab (id: ${id} title: ${title}, url: ${url}) is in reader mode, you can exit reader mode and try again",
  "tab.still-loading": "Target tab (id: ${id} title: ${title}, url: ${url}) is still loading, can not clip a loading web page, you can wait untill page loaded and try again",

  "native-app.version-invalid": "Extension require the version of Native Application bigger than or equal to ${requiredVersion}, But current version is ${currentVersion}, please <a href='go.page:native-app#upgrade' target='_blank'>upgrade your native application</a>",
  "native-app.not-installed": "It seems like you haven't installed it correctly. (<a href='go.page:native-app' target='_blank'>How to install it</a>)",
};

export default Object.assign(common, values);
