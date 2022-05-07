"user strict";
(function (root, factory) {
  let apiRoot;
  try {apiRoot = browser} catch (e) {}
  try {apiRoot = chrome } catch (e) {}
  factory(root, apiRoot);
})(this, function(root, browser) {

  const PAGE_SCRIPTS = [
    "js/page-scripts/page-locker.js",
  ];

  function getUrl(filePath) {
    return browser.runtime.getURL(filePath);
  }

  function injectScript(url) {
    const script = document.createElement('script');
    script.setAttribute('src', url);
    (
         document.head
      || document.body
      || document.documentElement
      || document
    ).appendChild(script);
    script.remove();
  }

  function main() {
    PAGE_SCRIPTS.forEach((filePath) => {
      const url = getUrl(filePath);
      injectScript(url);
    });
    console.debug("page scripts have injected");
  }

  main();

});
