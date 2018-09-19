
"use strict";

this.MxWcLink = (function(ExtApi) {
  const extensionRoot = ExtApi.getURL('/');
  const remoteRoot = "https://mika-cn.github.io/maoxian-web-clipper";
  const remotePaths = {
    "en": {
      "home": "/index.html",
      "faq-allow-access-file-urls": "/faq.html#allow-access-file-urls",
      "native-app": "/native-app/index.html"
    },
    "zh-CN": {
      "home": "/index-zh-CN.html",
      "faq-allow-access-file-urls": "/faq-zh-CN.html#allow-access-file-urls",
      "native-app": "/native-app/index-zh-CN.html"
    }
  }

  /*
   * @param {String} pageName
   *   extension => extPage.$name
   *   remote    => $name
   */
  function get(pageName) {
    if (pageName.startsWith('extPage.')) {
      return getExtensionPageLink(pageName);
    } else {
      return getRemoteLink(pageName);
    }
  }

  /*
   * @private
   */
  function getRemoteLink(pageName){
    let dict = remotePaths[ExtApi.locale];
    if (!dict) { dict = remotePaths['en'] }
    const path = dict[pageName];
    if(path) {
      return remoteRoot + path;
    } else {
      throw new Error(`UnknowPage: ${pageName}(name)`);
    }
  }

  /*
   * @private
   */
  function getExtensionPageLink(pageName){
    const name = pageName.split('.')[1];
    const path = getExtensionPagePath(name);
    return ExtApi.getURL(path);
  }

  function getExtensionPagePath(name){
    return `/pages/${name}.html`;
  }


  return {
    get: get,
    extensionRoot: extensionRoot,
    getExtensionPagePath: getExtensionPagePath
  }
})(ExtApi);
