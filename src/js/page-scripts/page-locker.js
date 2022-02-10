(function (root, factory) {
  factory(root);
})(window, function(root) {
  /**
   * This script is used to avoid the scripts of web page change the DOM tree
   * when the web clipper is between "actived" and "clipped".
   *
   * This will make the preparation of web page (usage of Assistant) easier.
   */

  const state = {locked: false};
  const bindedListener = {};

  function interceptEvent(type) {
    const options = {capture: true, passive: false};
    root.addEventListener(type, (e) => {
      if (state.locked) {
        if (bindedListener[type]) { bindedListener[type]() }
        stopEvent(e)
      }
    }, options);
  }

  function wrapObserver(observerName) {
    if (root[observerName]) {
      const OriginalObserver = root[observerName];
      root[observerName] = class extends OriginalObserver {
        constructor(callback, options) {
          const wrappedCallback = function(entries, observer) {
            if (state.locked) {
              // Do nothing
            } else {
              callback(entries, observer);
            }
          }
          super(wrappedCallback, options);
        }
      }
    }
  }

  function stopEvent(e) {
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  }

  function lock()   {state.locked = true}
  function unlock() {state.locked = false}

  function getMxEvType(name) {
    return ['___', 'mx-wc', 'page', name].join('.');
  }

  function sendMxEv(name) {
    const ev = new CustomEvent(getMxEvType(name))
    document.dispatchEvent(ev);
  }

  function listenMxEv(name, listener) {
    const type = getMxEvType(name);
    document.addEventListener(type, listener);
  }

  function main() {
    interceptEvent('scroll');
    interceptEvent('resize');
    wrapObserver('IntersectionObserver');
    wrapObserver('ResizeObserver');

    bindedListener.resize = () => { sendMxEv('resize') }
    listenMxEv('lock', lock);
    listenMxEv('unlock', unlock);
    console.debug("page locker init....");
  }

  main();
});
