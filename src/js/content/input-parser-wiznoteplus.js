;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(require('../lib/tool.js'));
  } else {
    // browser or other
    root.MxWcInputParser_WizNotePlus = factory(root.MxWcTool);
  }
})(this, function(T, undefined) {
  "use strict";

  //==========================================
  // Input Parser for WizNotePlus
  //==========================================

  function parse(params) {
      let {format, title, category, tags, domain, link, config} = params;

      // Set default title
      if(title === ""){ title = 'Untitled' }

      // Add domain as tag
      const appendTags = []
      if (config.saveDomainAsTag) {
          appendTags.push(domain);
      }

      // Set default category
      if (category === '') {
          category = (config.defaultCategory === '' ? 'default' : config.defaultCategory);
      }

      // Set main filename, "index" is used to identify the entry point of document
      const mainFilename = ['index', format].join('.');;

      // clipId
      const now = T.currentTime();
      const clipId = now.str.intSec;

      // Keep all paths relative to $WIZNOTE_TEMP/webclipping
      const storageInfo =  {
          /** the path to place index.html and assetFolder */
          mainFileFolder: clipId,
          mainFileName: mainFilename,
          /** the path to place frame files */
          frameFileFolder: clipId + "/index_files",
          /** the path to place asset files */
          assetFolder: clipId + "/index_files",
          /** the path is relative to index.html */
          assetRelativePath: "index_files"
      };

      const info = {
          clipId     : clipId,
          format     : format,
          title      : title,
          link       : link,
          category   : category,
          tags       : tags.concat(appendTags),
          created_at : now.toString(),
      }

      const inputHistory = { title: title, category: category, tags: tags }

      const result = {
          info: info,
          storageInfo: storageInfo,
          input: inputHistory,
          /* We don't need to save index.json, so we don't need infoFileFolder
             and infoFileName too. */
          needSaveIndexFile: false,
          needSaveTitleFile: false
      }

      return result;
  }

  return {parse: parse}
});
