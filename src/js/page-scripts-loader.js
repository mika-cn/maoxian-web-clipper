"user strict";
(function (root, factory) {
  factory(root);
})(this, function(root) {

  const PAGE_SCRIPTS = [
    "js/page-scripts/page-locker.js",
  ];

  function getUrl(filePath) {
    return (browser || chrome).runtime.getURL(filePath);
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
