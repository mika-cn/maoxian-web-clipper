;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('./input-parser-default.js'),
      require('./input-parser-wiznoteplus.js')
    );
  } else {
    // browser or other
    root.MxWcInputParser = factory(
      root.MxWcInputParser_Default,
      root.MxWcInputParser_WizNotePlus
    );
  }
})(this, function(Default, WizNotePlus, undefined) {
  "use strict";

  // params: {format, title, category, tags, host, link, config}
  function parse(params) {
    const {config} = params;
    switch(config.clippingHandler) {
      case 'Browser':
      case 'NativeApp':
        return Default.parse(params);
      case 'WizNotePlus':
        return WizNotePlus.parse(params);
    }
    throw new Error('Should not reach here');
  }

  return {parse: parse}
});
