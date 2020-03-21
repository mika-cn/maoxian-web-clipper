  "use strict";

  import Default from './input-parser-default.js';
  import WizNotePlus from './input-parser-wiznoteplus.js';

  // params: {format, title, category, tags, domain, link, config}
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

  const InputParser = {parse: parse}

  export default InputParser;
