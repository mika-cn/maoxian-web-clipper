
(function(global) {

  // params: {format, title, category, tags, host, link, config}
  function parse(params) {
    const {config} = params;
    switch(config.clippingHandler) {
      case 'Browser':
      case 'NativeApp':
        return InputParser_Default.parse(params);
      case 'WizNotePlus':
      {
        //FIXME: Move the parser to WizNotePlus clipping-handler
        let result = InputParser_Default.parse(params);
        // "index" is used to identify the entry point of document
        result.info.filename = ['index', result.info.format].join('.');
        // Keep all paths relative to $WIZNOTE_TEMP/webclipping
        result.path.saveFolder = result.info.clipId;                     /** the path to place index.html and assetFolder */
        result.path.assetFolder = result.info.clipId + "/index_files";   /** the path to place asset files */
        result.path.assetRelativePath = "index_files";                   /** the path is relative to index.html */
        //
        result.needSaveTitleFile = false;
        return result;
      }
    }
    throw new Error('Should not reach here');
  }

  global.InputParser = {parse: parse};
})(this);
