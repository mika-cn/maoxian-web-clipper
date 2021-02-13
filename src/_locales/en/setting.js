(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "label.version": "Current Version: ",
    "label.ruby-version": "Ruby Version: ",

    // title
    "title.intro": "Intro",
    "title.feature": "Features",
    "title.status": "Status",
    "title.detail": "Detail",

    "title.general": "General",
    "title.storage": "Storage",
    "title.assistant": "Assistant",
    "title.public-plan": "Public plan",
    "title.subscriptions": "Subscriptions",
    "title.subscription.name": "Name",
    "title.subscription.version": "Version",
    "title.subscription.size": "Size",
    "title.subscription.plans": "Plans",
    "title.subscription.url": "Url",
    "title.subscription.detail": "Detail",
    "title.custom-plan": "Custom plan",
    "title.handler": "Handler",
    "title.handler-browser": "Browser",
    "title.handler-native-app": "Native App",
    "title.handler-wiz-note-plus" :"WizNotePlus",
    "title.reset-and-backup": "Reset / Backup",
    "title.reset": "Reset",
    "title.backup": "Backup",
    "title.restore": "Restore",

    "title.save-format": "Save Format",
    "title.control": "Control",
    "title.file-url": "File URL",
    "title.advanced": "Advanced",
    "title.request": "HTTP Request",
    "title.request-timeout": "Timeout",
    "title.request-max-tries": "Maximum tries",
    "title.request-referrer-policy": "Referrer Policy",
    "title.request-cache": "Cache",
    "title.misc": "Misc",
    "title.clipping-content": "Clipping Content",
    "title.html-content": "HTML",
    "title.markdown-content": "Markdown",
    "title.offline-page": "Offline Index Page",
    "title.refresh-history": "Refresh History",


    "title.root-folder": "Root Folder",
    "title.default-category": "Default Category",
    "title.clipping-folder-name": "Clipping Folder",
    "title.main-file": "Main File",
    "title.asset-file": "Asset File",
    "title.frame-file": "Frame File",
    "title.info-file": "Information File",
    "title.title-file": "Title File",

    "title.path": "Path",
    "path-intro.format": "Format: ",
    "path.download": "download path",
    "path.filename": "filename of main file",
    "folder.root": "root folder",
    "folder.category": "category folder",
    "folder.clipping": "clipping folder",

    "help.label": "Click me to show (or hide) help content",
    "help.avariable-variable": "Variables",
    // variables
    "variable-in-folder": "Variables below can be used in saving folder",
    "variable-in-filename": "Variables below can be used in filename",
    "variable-intro": "<strong>Avariable variables are:</strong>",
    "variable.storage-path": '$STORAGE-PATH =&gt; <code>download path</code> / <code>root folder</code>',
    "variable.category-path": '$CATEGORY-PATH =&gt; <code>download path</code> / <code> root folder</code> / <code>category folder</code>',
    "variable.clipping-path": '$CLIPPING-PATH =&gt; <code>download path</code> / <code>root folder</code> / <code>category folder</code> / <code>clipping folder</code>',

    "variable.none": "<pre>$NONE => empty value (not category)</pre>",
    "variable.title": "<pre>$TITLE  => title </pre>",
    "variable.domain": "<pre>$DOMAIN => Domain of current website (e.g. blog.example.org) </pre>",
    "variable.format": "<pre>$FORMAT => 'html' or 'md' (depends on saving format) </pre>",

    "variable.year"                : "<pre>$YYYY => year (4 digits, e.g. 2018)</pre>",
    "variable.short-year"          : "<pre>$YY   => year (2 digits, e.g. 18)</pre>",
    "variable.month"               : "<pre>$MM   => month (2 digits, 01 ~ 12)</pre>",
    "variable.day"                 : "<pre>$DD   => day (2 digits, 01 ~ 31)</pre>",
    "variable.hour"                : "<pre>$HH   => hour (2 digits, 00 ~ 23)</pre>",
    "variable.minute"              : "<pre>$mm   => minute (2 digits, 00 ~ 59)</pre>",
    "variable.second"              : "<pre>$SS   => second (2 digits, 00 ~ 59)</pre>",
    "variable.time-integer-second" : "<pre>$TIME-INTSEC => clipping time in seconds (e.g. 1578712781)</pre>",


    "path.download.intro": "download path： Download location of your browser, If you use NativeApp to save clipping file, this path is the value of \"data_dir\" in configure file (config.yaml) of NativeApp.",
    "path.filename.intro": "filename of main file： The filename of main file (entry file), default is <code>index.html</code> or <code>index.md</code>.",
    "folder.root.intro": "root folder： This is the storage root, all clipping files will storage under this folder.",
    "folder.category.intro": "category folder: This part is used to category your clippings. It's value depends on what you input in saving form. Let's assume your input value is <code>news/sports</code>, then extension will create a folder named <code>news</code> and a subfolder named <code>sports</code>.",
    "folder.clipping.intro": "clpping folder： MaoXian can create a clipping folder in every clipping, and saves clipping files inside it.",

    // handler
    "handler.browser.name": "Browser",
    "handler.browser.intro": "Browser is the built-in handler.",
    "handler.browser.feature.a": "Save clipping files to your hard disk",
    "handler.browser.feature.b": "Synchronize offline index page",

    "handler.native-app.name": "Native App",
    "handler.native-app.intro": "This is a little application. We develope it to enhance MaoXian’s abilities.",
    "handler.native-app.feature.a": "Save clipping file (to avoid conflic with download manage extension)",
    "handler.native-app.feature.b": "Delete clipping file (when you delete a clipping record in clipping history page, it delete files that relative to that record)",
    "handler.native-app.feature.c": "Refresh history (This is useful when you have two clipping sources (e.g. two browsers on same computer or different computers) and want to keep clipping history latest)",
    "handler.native-app.warning": "<strong> Warning! </strong><br /> If you enable this handler, you must <a href='go.page:native-app' target='_blank'>install native application</a> first.",

    "handler.wiz-note-plus.name": "WizNotePlus",
    "handler.wiz-note-plus.intro": "WizNotePlus is a cross-platform cloud based note-taking client.",
    "handler.wiz-note-plus.feature.a": "Save clipping file to WizNotePlus database.",
    "handler.wiz-note-plus.warning": "<strong> Warning! </strong><br /> If you enable this handler, you must <a href='https://github.com/altairwei/WizNotePlus/releases' target='_blank'>install WizNotePlus application</a> first.",



    "option.request-referrer-policy.origin-when-cross-origin": "originWhenCrossOrigin: full path (origin + path) when request to same origins, origin (protocol + host + port) only when request to other origins.",
    "option.request-referrer-policy.origin": "origin: origin only (protocol + host + port).",
    "option.request-referrer-policy.no-referrer": "noReferrer: The Referer header will not be sent.",
    "option.request-referrer-policy.unsafe-url": "unsafeUrl: The Referer header will include full path (origin + path).",



    "notice.info.storage.browser": "Use browser to download clipping result.<br />",
    "notice.info.storage.native-app": "Use a native application to save clipping result ( If you already install some download manage extension, your can choose this option to avoid conflic between extension), You need to <a href='go.page:native-app' target='_blank'>install a native application</a>.",
    "notice.info.storage.wiz-note-plus": "Use WizNotePlus to save clipping result.<br />",

    "notice.info.offline-page.browser": "$BLANK",
    "notice.info.offline-page.native-app": "$BLANK",
    "notice.info.refresh-history.native-app": "$BLANK",

    "notice.warning.storage.browser": "$BLANK",
    "notice.warning.storage.native-app": "$BLANK",
    "notice.warning.storage.wiz-note-plus": "$BLANK",
    "notice.warning.offline-page.browser": "$BLANK",
    "notice.warning.offline-page.native-app": "$BLANK",
    "notice.warning.refresh-history.native-app": "$BLANK",

    "notice.danger.native-app-not-ready": "Native App is not ready yet.<br />ErrorMessage: $MESSAGE",

    "notice.danger.wiz-note-plus-ready": "Connected to WizNotePlus successfully.",
    "notice.danger.wiz-note-plus-not-ready": "WizNotePlus is not ready yet, error message: $MESSAGE. <br />It seems like you haven't open it. If you haven't install it, please visit: (<a href='https://github.com/altairwei/WizNotePlus/releases' target='_blank'>How to install it</a>)",

    // buttons
    "button.generate-now": "Generate Now",
    "button.refresh-now": "Refresh Now",
    "button.update-now": "Update Now",
    "button.save": "Save",
    "button.reset-to-default": "Reset to default settings",
    "button.backup-to-file": "Backup to file",
    "button.restore-from-file": "Restore from file",

    // notice
    "notice.main-file-intro": "Main file is the HTML file or the Markdown file (depends on which format that you configure to save) that you clip",
    "notice.asset-file-intro": "Asset files are image files, style files, web font files and website icon files (notice that this doesn't include script files, MaoXian won't save script files due to security reason)",
    "notice.frame-file-intro": "Frame file is another webpage that is embedded in a webpage. In the process of clipping, MaoXian will save these files if your saving format is HTML. on the other hand, MaoXian will embed it's content into main file if saving format is Markdown",
    "notice.info-file-intro": "Information file (or meta file) is used to save clipping information (includes saving format, clipping time, original url, category, tags etc.)",
    "notice.title-file-intro": "Title file is just an empty file with a filename that contains the title. it's useful, expecially when the path of main file doesn't contains title information, save this file alongside the main file for more conviniently browser.",

    "notice.file-url.intro": "This item is to tell extension that your allow it to access file URLs (file://).",
    "notice.file-url.link-label": "Learn how to setting",
    "notice.file-url.help-msg": "Your will need message below:",
    "notice.file-url.ext-id": "Extension identify",
    "notice.file-url-warning": "This item will not change your browser's setting.<br />Only check this after you allow browser to access file URLs.",
    "notice.front-matter": "YAML Front Matter is a block of text that is placed in front of markdown content. Usually, it is used to save meta information. You can use it to save clipping information",
    "notice.front-matter-template": "Using template below to configure which information you want to save.<br />Avariable variables are: <strong>title, url, category, tags, createdAt, year, sYear, month, day, hour, minute, second, intSec</strong>.",
    "notice.root-folder": "<strong>Notice:</strong><br /> This folder is used as storage entry, We suggest you don't change it after you set it right. If you do want to change it, you should change the name of folder in your file system too. So that you won't get two storage entry.",
    "notice.default-category": "Default category is the value that will be used if you don't specify a category in saving form.<br />Use <strong>/</strong> to separate sub category<br />",
    "notice.clipping-folder-name": "MaoXian can creates a directory to store clipping result in every clipping, we call this directory clipping folder.",
    "notice.clipping-handler.link-label": "install native App",
    "notice.offline-page": "Offline index page is a static HTML page which can be used to browse your clippings without MaoXian Web Clipper or network. ",
    "notice.offline-page.link-label": "Learn more detail",
    "notice.autogenerate-clipping-js": "<strong>Autogenerate Javascript File</strong><br />Everytime when you clip a web page, or delete a clipping history, MaoXian will generate a javascript file contains all your clippings and save to the path you configure. this script file will be accessed by offline web page that you downloaded.",
    "notice.clipping-js-path": "<strong>Clipping javascript Path</strong><br />Where to save clipping javascript file. <br />Use <strong>$STORAGE-PATH</strong> to represent <code>download path</code> / <code>root folder</code>",
    "notice.refresh-history": "This is useful when you have two clipping sources(e.g. two browsers on same computer or different computers) and want to keep clipping history latest.",
    "notice.assistant-intro": "Using MaoXian Assistant, you can predefine some actions in a plan, and this plan will be applied to the webpage that you're going to clip. These actions includes picking an element, hiding an element, showing an element and changing attributes of an element.",
    "notice.public-plan-intro": "Public Plans are contributed by every MaoXian user. so that more people can use it.",
    "notice.edit-subscription": "Using input field below to edit your subscriptions. Using line break to separate subscription. Any line begin with <code>#</code> will be treated as comment. <br /><br /><strong>Notice:</strong><br />1. The default subscription url that provided by extension hasn't download yet, If you are first time to using this function, click \"Update Now\" button to download it. <br />2. Click \"Save\" button won't trigger any download. So after your subscriptions saved, you should click \"Update Now\" or enable \"auto update\" to download it<br /><br />See <a href='go.page:public-subscriptions' target='_blank'>this page</a> for more subscriptions.",
    "notice.custom-plan-intro": 'Custom Plans are written by you (<a href="go.page:how-to-write-a-plan" target="_blank">Learn how to write a plan</a>). This list has higher priority than public plans.',
    "notice.request-cache": 'Currently, only Firefox supports request cache.',
    "notice.request-cache-applying": "<strong>Warning:</strong><br />The settings of cache will only be applied after you restart the browser.",


    // label
    "label.storage-folder": "Saving Folder",
    "label.storage-filename": "Filename",
    "label.save-info-file-input": "Save Information File",
    "label.save-info-file-link": "(How to change it?)",
    "label.save-title-file-input": "Save Title File",

    "label.enable-handler": "Enable this handler",
    "label.file-url-input": "I enabled 'allow file scheme access' ",
    "label.request-timeout-input": "Timeout for performing a request (secs, 5 ~ 84600)",
    "label.request-max-tries-input": "Maximum tries to perform a request, If this value is bigger than one, that means we'll resend the reqeust if it fails",
    "label.request-cache-size-input": "Cache size (how many requests we'll cache, 0 ~ 500)",
    "label.request-cache-css-input": "Cache stylesheets (CSS)",
    "label.request-cache-image-input": "Cache images",
    "label.request-cache-web-font-input": "Cache web fonts",
    "label.clip-information-input": "Include clipping information (original url, time, category and tags) in main file",
    "label.md-front-matter-enabled-input": "Enable YAML Front Matter",
    "label.save-icon-input": "Save website icons",
    "label.save-web-font-input": "Save web fonts (not recommended)",
    "label.save-css-image-input": "Save CSS background images (not recommended)",
    "label.save-domain-tag-input": "Save current domain as tag",
    "label.hotkey-switch-enabled-input": "Enable hotkey `c` (clip switch)",
    "label.mouse-mode-enabled-input": "Mouse friendly mode",
    "label.input-field-save-format-enabled": "Enable selecting save format in form",
    "label.auto-input-last-category": "Auto input the last category",
    "label.remember-selection-input": "Remember selection and try to apply it next time",
    "label.autogenerate-clipping-js-input": "Autogenerate javascript file",
    "label.not-generated-yet": "Not generated yet",
    "label.generate-now-msg-sent": "Generate command has been sent",
    "label.generate-now-success": "Generate success",
    "label.last-generate-time": "Last generated time",
    "label.auto-refresh-history-input": "Auto refresh history (when you open the browser)",
    "label.refresh-now-msg-sent": "Refresh command has been sent",
    "label.refresh-now-success": "Refresh success",
    "label.last-refresh-time": "Last refreshed time",
    "label.communicate-with-third-party-input": "Communicate with third party",
    "label.assistant-enabled-input": "Enable assistant",
    "label.auto-update-public-plan-input": "Auto update public plan (when you open the browser)",

    "label.backup-setting-page-config-input": "Setting page's configuration",
    "label.backup-history-page-config-input": "History page's configuration",
    "label.backup-assistant-data-input": "Assistant data (subscriptions and plans)",
    "label.backup-selection-data-input": "Remembered selection",


    "label.last-update-time": "Last updated time",
    "label.update-now-success": "Update success",
    "label.reset-to-default-intro": "Reset All items below",
    "label.reset-to-default-warning": "All your settings will be reset to default, are you sure?",
    "label.reset-to-default-success": "Reset success",
    "label.restore-from-file-success": "Restore success",

    // placeholder
    "placeholder.notblank": "This value can not be blank!",
  };
  return { values: Object.assign({}, currValues, values) }
});
