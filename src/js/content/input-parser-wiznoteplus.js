
//==========================================
// Input Parser for WizNotePlus
//==========================================

(function(global) {

    function parse(params) {
        let {format, title, category, tags, host, link, config} = params;

        // Set default title
        if(title === ""){ title = 'Untitled' }

        // Add host as tag
        const appendTags = []
        if (config.saveDomainAsTag) {
            appendTags.push(host);
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
        const path =  {
            /** the path to place index.html and assetFolder */
            saveFolder: clipId, 
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
            filename   : mainFilename
        }

        const inputHistory = { title: title, category: category, tags: tags }

        const result = {
            info: info,
            path: path,
            input: inputHistory,
            needSaveIndexFile: false,
            needSaveTitleFile: false
        }

        return result;
    }

    const publicApi = {parse: parse};

    if (typeof module === 'object' && module.exports) {
        // CJS
        module.exports = publicApi;
    } else {
        // browser or other
        global.InputParser_WizNotePlus = publicApi;
    }
    return

})(this);
