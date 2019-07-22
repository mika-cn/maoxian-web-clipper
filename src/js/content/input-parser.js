
(function(global) {

  // params: {format, title, category, tags, host, link, config}
  function parse(params) {
    const {config} = params;
    switch(config.clippingHandler) {
      case 'Browser':
      case 'NativeApp':
        return InputParser_Default.parse(params);
      case 'WizNotePlus':
        //FIXME: Get parser from WizNotePlus handler
        return InputParser_Default.parse(params);
    }
    throw new Error('Should not reach here');
  }

  global.InputParser = {parse: parse};
})(this);
