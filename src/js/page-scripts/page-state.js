
(function (root, factory) {
    factory(root);
})(window, function(root) {
  // This script is used to expose value
  function listenMxEv() {
    const type = getMxEvType('set-state');
    document.addEventListener(type, function(e) {
      try {
        const msg = JSON.parse(e.detail || '{}');
        const {name, value} = msg;
        if (name && name.startsWith('___mxwc_')) {
          window[name] = value;
        }
      } catch(e) {}
    });
  }

  function getMxEvType(name) {
    return ['___', 'mx-wc', 'page', name].join('.');
  }

  function main() {
    listenMxEv();
  }

  main();

});

