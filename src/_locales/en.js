  "use strict";

  const LocaleEn = {
  "values": {
    "name": "MaoXian web clipper",

    //=====================================
    // global
    //=====================================
    "none": "None",

    "btn.confirm": "Confirm",
    "btn.remove": "Remove",

    "hint.no-record": "No records",

    "op.saved": "Saved!",
    "op.update-success": "Update Success!",
    "op.delete-success": "Delete Success!",

    // options
    "option.save-format.html.name": "HTML",
    "option.save-format.md.name": "Markdown",

    // errors
    "error.not-a-number": "Input value is not a number",
    "error.not-in-allowed-range": "Input value is not in allowed range",

    // clipping attributes
    "attr.title": "Title",
    "attr.path": "Path",
    "attr.time": "Time",
    "attr.category": "Category",
    "attr.tag": "Tag",
    "attr.tags": "Tags",
    "attr.format": "Format",
    "attr.original-url": "From",

    // task attributes
    "task.clipId": "Clipping ID",
    "task.filename": "Filename",
    "task.timeout": "Timeout",
    "task.tries": "Maximum Tries",
    "task.createdAt": "Created Time",
    "task.filenameAndUrl": "Filename and Url",


    //=====================================
    // home page
    //=====================================
    "home.nav.extension-pages": "Extension Pages",
    "home.nav.remote-pages": "Remote Pages",
    "home.label.version": "Current Version",
    // extension pages
    "page.home": "Extension Home Page",
    "page.setting": "Setting",
    "page.history": "History",
    "page.reset-history": "Reset history",
    "page.support": "Support",
    "page.failed-tasks": "Failed tasks",

    "desc.setting": "Setting: save format, save path etc.",
    "desc.history": "Where to see what you have clipped.",
    "desc.reset-history": "Where you reset your clipping history when you install MaoXian in a new device.",
    "desc.support": "This page contains technical information that might be useful when you’re trying to solve a problem or report a bug",
    "desc.failed-tasks": "This page collect all failed tasks (files that failed to save), you can retry saving these tasks on this page.",

    // remote pages
    "page.remote.home": "Home",
    "page.remote.faq": "FAQ",
    "page.remote.native-app": "Native Application",
    "page.remote.offline-page": "Offline Index Page",
    "page.remote.project.index": "project source code",
    "page.remote.project.issue": "Issue page",

    "desc.remote.home": "Home page of website",
    "desc.remote.faq": "Frequently Asked Question",
    "desc.remote.native-app": "A native application that can enhance the abilities of MaoXian",
    "desc.remote.offline-page": "A static HTML page which can be used to browse your clippings without MaoXian or network",
    "desc.remote.project.index": "This is the project page of Maoxian. yes, it's open source.",
    "desc.remote.project.issue": "Where you giving suggestions or reporting bugs",

    //=====================================
    // popup page
    //=====================================
    "popup.menu.clip": "Clip",
    "popup.menu.history": "History",
    "popup.menu.setting": "Setting",
    "popup.menu.home": "Home",
    "popup.menu.last-result": "Show result",
    "popup.menu.debug": "Debug",

    //=====================================
    // welcome page
    //=====================================
    "welcome.installation-hint": "MaoXian Web Clipper $version has been installed",
    "welcome.sayhi": "Welcome!",
    "welcome.extra-intro": "Before you start, please take these two extra steps to ensure better experience with MaoXian.",
    "welcome.extra-1-chrome": "1. Turn off Chrome's Save As dialog so that you won't be asked where to save file for every download.<br />This can be done by clearing the checkbox before <strong><a href='' link='chrome://settings/downloads' class='tab-link'>chrome://settings</a></strong> &gt; <i>Downloads</i> &gt; <i>Ask where to save each file before downloading</i>",
    "welcome.extra-1-firefox": "1. Turn off Firefox's Save As dialog so that you won't be asked where to save fille for every download.<br />This can be done by clearing the radio-button before <strong>about:preferences</strong> &gt; <i>Downloads</i> &gt; <i>Always ask you where to save files</i>",
    "welcome.extra-2-chrome": "2. Allow MaoXian to access file URLs for fast file preview, by ticking the checkbox <i>Allow access to file URLs</i> on <strong>$extensionLink</strong>.",
    "welcome.extra-2-firefox": "2. Allow MaoXian to access file URLs for fast file preview, see <strong><a href='go.page:faq-allow-access-file-urls' target='_blank'>Allow Access File URLs</a></strong>",
    "welcome.notice": "<strong class='green'>Notice:</strong> If you want to clip a page before MaoXian's installation. Reload it first!",
    "welcome.last-hint": "If you have any question, please visit our <a href='go.page:faq' target='_blank'>FAQ</a> page</p>",


    //=====================================
    // setting page
    //=====================================
    "setting.warning": "Warning",
    "setting.version": "Current Version: ",
    "setting.ruby-version": "Ruby Version: ",

    // errors
    "error.handler.not-enabled": "Handler is disabled",
    "error.handler.not-ready": "Handler is not ready",
    "error.value-invalid": "Value invalid",

    // title
    "setting.title.intro": "Intro",
    "setting.title.feature": "Features",
    "setting.title.status": "Status",
    "setting.title.detail": "Detail",

    "setting.title.general": "General",
    "setting.title.storage": "Storage",
    "setting.title.assistant": "Assistant",
    "setting.title.public-plan": "Public plan",
    "setting.title.subscriptions": "Subscriptions",
    "setting.title.subscription.name": "Name",
    "setting.title.subscription.version": "Version",
    "setting.title.subscription.size": "Size",
    "setting.title.subscription.plans": "Plans",
    "setting.title.subscription.url": "Url",
    "setting.title.subscription.detail": "Detail",
    "setting.title.custom-plan": "Custom plan",
    "setting.title.handler": "Handler",
    "setting.title.handler-browser": "Browser",
    "setting.title.handler-native-app": "Native App",
    "setting.title.handler-wiz-note-plus" :"WizNotePlus",
    "setting.title.reset-and-backup": "Reset / Backup",
    "setting.title.reset": "Reset",
    "setting.title.backup": "Backup",
    "setting.title.restore": "Restore",

    "setting.title.save-format": "Save Format",
    "setting.title.control": "Control",
    "setting.title.file-url": "File URL",
    "setting.title.advanced": "Advanced",
    "setting.title.request": "HTTP Request",
    "setting.title.request-timeout": "Timeout",
    "setting.title.request-max-tries": "Maximum tries",
    "setting.title.request-referrer-policy": "Referrer Policy",
    "setting.title.request-cache": "Cache",
    "setting.title.misc": "Misc",
    "setting.title.clipping-content": "Clipping Content",
    "setting.title.html-content": "HTML",
    "setting.title.markdown-content": "Markdown",
    "setting.title.offline-page": "Offline Index Page",
    "setting.title.refresh-history": "Refresh History",


    "setting.title.root-folder": "Root Folder",
    "setting.title.default-category": "Default Category",
    "setting.title.clipping-folder-name": "Clipping Folder",
    "setting.title.main-file": "Main File",
    "setting.title.asset-file": "Asset File",
    "setting.title.frame-file": "Frame File",
    "setting.title.info-file": "Information File",
    "setting.title.title-file": "Title File",

    "setting.title.path": "Path",
    "setting.path-intro.format": "Format: ",
    "setting.path.download": "download path",
    "setting.path.filename": "filename of main file",
    "setting.folder.root": "root folder",
    "setting.folder.category": "category folder",
    "setting.folder.clipping": "clipping folder",

    "setting.help.label": "Click me to show (or hide) help content",
    "setting.help.avariable-variable": "Variables",
    // variables
    "setting.variable-in-folder": "Variables below can be used in saving folder",
    "setting.variable-in-filename": "Variables below can be used in filename",
    "setting.variable-intro": "<strong>Avariable variables are:</strong>",
    "setting.variable.storage-path": '$STORAGE-PATH =&gt; <code>download path</code> / <code>root folder</code>',
    "setting.variable.category-path": '$CATEGORY-PATH =&gt; <code>download path</code> / <code> root folder</code> / <code>category folder</code>',
    "setting.variable.clipping-path": '$CLIPPING-PATH =&gt; <code>download path</code> / <code>root folder</code> / <code>category folder</code> / <code>clipping folder</code>',

    "setting.variable.none": "<pre>$NONE => empty value (not category)</pre>",
    "setting.variable.title": "<pre>$TITLE  => title </pre>",
    "setting.variable.domain": "<pre>$DOMAIN => Domain of current website (e.g. blog.example.org) </pre>",
    "setting.variable.format": "<pre>$FORMAT => 'html' or 'md' (depends on saving format) </pre>",

    "setting.variable.year"                : "<pre>$YYYY => year (4 digits, e.g. 2018)</pre>",
    "setting.variable.short-year"          : "<pre>$YY   => year (2 digits, e.g. 18)</pre>",
    "setting.variable.month"               : "<pre>$MM   => month (2 digits, 01 ~ 12)</pre>",
    "setting.variable.day"                 : "<pre>$DD   => day (2 digits, 01 ~ 31)</pre>",
    "setting.variable.hour"                : "<pre>$HH   => hour (2 digits, 00 ~ 23)</pre>",
    "setting.variable.minute"              : "<pre>$mm   => minute (2 digits, 00 ~ 59)</pre>",
    "setting.variable.second"              : "<pre>$SS   => second (2 digits, 00 ~ 59)</pre>",
    "setting.variable.time-integer-second" : "<pre>$TIME-INTSEC => clipping time in seconds (e.g. 1578712781)</pre>",


    "setting.path.download.intro": "download path： Download location of your browser, If you use NativeApp to save clipping file, this path is the value of \"data_dir\" in configure file (config.yaml) of NativeApp.",
    "setting.path.filename.intro": "filename of main file： The filename of main file (entry file), default is <code>index.html</code> or <code>index.md</code>.",
    "setting.folder.root.intro": "root folder： This is the storage root, all clipping files will storage under this folder.",
    "setting.folder.category.intro": "category folder: This part is used to category your clippings. It's value depends on what you input in saving form. Let's assume your input value is <code>news/sports</code>, then extension will create a folder named <code>news</code> and a subfolder named <code>sports</code>.",
    "setting.folder.clipping.intro": "clpping folder： MaoXian can create a clipping folder in every clipping, and saves clipping files inside it.",

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
    "handler.native-app.error.version": "Extension require the version of Native Application bigger than or equal to $requiredVersion, But current version is $currentVersion, please <a href='go.page:native-app#upgrade' target='_blank'>upgrade your native application</a>",
    "handler.native-app.error.install": "It seems like you haven't installed it correctly. (<a href='go.page:native-app' target='_blank'>How to install it</a>)",

    "handler.wiz-note-plus.name": "WizNotePlus",
    "handler.wiz-note-plus.intro": "WizNotePlus is a cross-platform cloud based note-taking client.",
    "handler.wiz-note-plus.feature.a": "Save clipping file to WizNotePlus database.",
    "handler.wiz-note-plus.warning": "<strong> Warning! </strong><br /> If you enable this handler, you must <a href='https://github.com/altairwei/WizNotePlus/releases' target='_blank'>install WizNotePlus application</a> first.",



    "setting.option.request-referrer-policy.origin-when-cross-origin": "originWhenCrossOrigin: full path (origin + path) when request to same origins, origin (protocol + host + port) only when request to other origins.",
    "setting.option.request-referrer-policy.origin": "origin: origin only (protocol + host + port).",
    "setting.option.request-referrer-policy.no-referrer": "noReferrer: The Referer header will not be sent.",
    "setting.option.request-referrer-policy.unsafe-url": "unsafeUrl: The Referer header will include full path (origin + path).",



    "setting.notice.info.storage.browser": "Use browser to download clipping result.<br />",
    "setting.notice.info.storage.native-app": "Use a native application to save clipping result ( If you already install some download manage extension, your can choose this option to avoid conflic between extension), You need to <a href='go.page:native-app' target='_blank'>install a native application</a>.",
    "setting.notice.info.storage.wiz-note-plus": "Use WizNotePlus to save clipping result.<br />",

    "setting.notice.info.offline-page.browser": "$BLANK",
    "setting.notice.info.offline-page.native-app": "$BLANK",
    "setting.notice.info.refresh-history.native-app": "$BLANK",

    "setting.notice.warning.storage.browser": "$BLANK",
    "setting.notice.warning.storage.native-app": "$BLANK",
    "setting.notice.warning.storage.wiz-note-plus": "$BLANK",
    "setting.notice.warning.offline-page.browser": "$BLANK",
    "setting.notice.warning.offline-page.native-app": "$BLANK",
    "setting.notice.warning.refresh-history.native-app": "$BLANK",

    "setting.notice.danger.native-app-not-ready": "Native App is not ready yet.<br />ErrorMessage: $MESSAGE",

    "setting.notice.danger.wiz-note-plus-ready": "Connected to WizNotePlus successfully.",
    "setting.notice.danger.wiz-note-plus-not-ready": "WizNotePlus is not ready yet, error message: $MESSAGE. <br />It seems like you haven't open it. If you haven't install it, please visit: (<a href='https://github.com/altairwei/WizNotePlus/releases' target='_blank'>How to install it</a>)",

    // buttons
    "setting.button.generate-now": "Generate Now",
    "setting.button.refresh-now": "Refresh Now",
    "setting.button.update-now": "Update Now",
    "setting.button.save": "Save",
    "setting.button.reset-to-default": "Reset to default settings",
    "setting.button.backup-to-file": "Backup to file",
    "setting.button.restore-from-file": "Restore from file",

    // notice
    "setting.notice.main-file-intro": "Main file is the HTML file or the Markdown file (depends on which format that you configure to save) that you clip",
    "setting.notice.asset-file-intro": "Asset files are image files, style files, web font files and website icon files (notice that this doesn't include script files, MaoXian won't save script files due to security reason)",
    "setting.notice.frame-file-intro": "Frame file is another webpage that is embedded in a webpage. In the process of clipping, MaoXian will save these files if your saving format is HTML. on the other hand, MaoXian will embed it's content into main file if saving format is Markdown",
    "setting.notice.info-file-intro": "Information file (or meta file) is used to save clipping information (includes saving format, clipping time, original url, category, tags etc.)",
    "setting.notice.title-file-intro": "Title file is just an empty file with a filename that contains the title. it's useful, expecially when the path of main file doesn't contains title information, save this file alongside the main file for more conviniently browser.",

    "setting.notice.file-url.intro": "This item is to tell extension that your allow it to access file URLs (file://).",
    "setting.notice.file-url.link-label": "Learn how to setting",
    "setting.notice.file-url.help-msg": "Your will need message below:",
    "setting.notice.file-url.ext-id": "Extension identify",
    "setting.notice.file-url-warning": "This item will not change your browser's setting.<br />Only check this after you allow browser to access file URLs.",
    "setting.notice.front-matter": "YAML Front Matter is a block of text that is placed in front of markdown content. Usually, it is used to save meta information. You can use it to save clipping information",
    "setting.notice.front-matter-template": "Using template below to configure which information you want to save.<br />Avariable variables are: <strong>title, url, category, tags, createdAt, year, sYear, month, day, hour, minute, second, intSec</strong>.",
    "setting.notice.root-folder": "<strong>Notice:</strong><br /> This folder is used as storage entry, We suggest you don't change it after you set it right. If you do want to change it, you should change the name of folder in your file system too. So that you won't get two storage entry.",
    "setting.notice.default-category": "Default category is the value that will be used if you don't specify a category in saving form.<br />Use <strong>/</strong> to separate sub category<br />",
    "setting.notice.clipping-folder-name": "MaoXian can creates a directory to store clipping result in every clipping, we call this directory clipping folder.",
    "setting.notice.clipping-handler.link-label": "install native App",
    "setting.notice.offline-page": "Offline index page is a static HTML page which can be used to browse your clippings without MaoXian Web Clipper or network. ",
    "setting.notice.offline-page.link-label": "Learn more detail",
    "setting.notice.autogenerate-clipping-js": "<strong>Autogenerate Javascript File</strong><br />Everytime when you clip a web page, or delete a clipping history, MaoXian will generate a javascript file contains all your clippings and save to the path you configure. this script file will be accessed by offline web page that you downloaded.",
    "setting.notice.clipping-js-path": "<strong>Clipping javascript Path</strong><br />Where to save clipping javascript file. <br />Use <strong>$STORAGE-PATH</strong> to represent <code>download path</code> / <code>root folder</code>",
    "setting.notice.refresh-history": "This is useful when you have two clipping sources(e.g. two browsers on same computer or different computers) and want to keep clipping history latest.",
    "setting.notice.assistant-intro": "Using MaoXian Assistant, you can predefine some actions in a plan, and this plan will be applied to the webpage that you're going to clip. These actions includes picking an element, hiding an element, showing an element and changing attributes of an element.",
    "setting.notice.public-plan-intro": "Public Plans are contributed by every MaoXian user. so that more people can use it.",
    "setting.notice.edit-subscription": "Using input field below to edit your subscriptions. Using line break to separate subscription. Any line begin with <code>#</code> will be treated as comment. <br /><br /><strong>Notice:</strong><br />1. The default subscription url that provided by extension hasn't download yet, If you are first time to using this function, click \"Update Now\" button to download it. <br />2. Click \"Save\" button won't trigger any download. So after your subscriptions saved, you should click \"Update Now\" or enable \"auto update\" to download it<br /><br />See <a href='go.page:public-subscriptions' target='_blank'>this page</a> for more subscriptions.",
    "setting.notice.custom-plan-intro": 'Custom Plans are written by you (<a href="go.page:how-to-write-a-plan" target="_blank">Learn how to write a plan</a>). This list has higher priority than public plans.',
    "setting.notice.request-cache": 'Currently, only Firefox supports request cache.',
    "setting.notice.request-cache-applying": "<strong>Warning:</strong><br />The settings of cache will only be applied after you restart the browser.",


    // label
    "setting.storage-folder.label": "Saving Folder",
    "setting.storage-filename.label": "Filename",
    "setting.save-title-file-input.label": "Save Title File",

    "setting.enable-handler.label": "Enable this handler",
    "setting.file-url-input.label": "I enabled 'allow file scheme access' ",
    "setting.request-timeout-input.label": "Timeout for performing a request (secs, 5~240)",
    "setting.request-max-tries-input.label": "Maximum tries to perform a request, If this value is bigger than one, that means we'll resend the reqeust if it fails",
    "setting.request-cache-size-input.label": "Cache size (how many requests we'll cache, 0 ~ 500)",
    "setting.request-cache-css-input.label": "Cache stylesheets (CSS)",
    "setting.request-cache-image-input.label": "Cache images",
    "setting.request-cache-web-font-input.label": "Cache web fonts",
    "setting.clip-information-input.label": "Include clipping information (original url, time, category and tags) in main file",
    "setting.md-front-matter-enabled-input.label": "Enable YAML Front Matter",
    "setting.save-icon-input.label": "Save website icons",
    "setting.save-web-font-input.label": "Save web fonts (not recommended)",
    "setting.save-css-image-input.label": "Save CSS background images (not recommended)",
    "setting.save-domain-tag-input.label": "Save current domain as tag",
    "setting.hotkey-switch-enabled-input.label": "Enable hotkey `c` (clip switch)",
    "setting.mouse-mode-enabled-input.label": "Mouse friendly mode",
    "setting.input-field-save-format-enabled.label": "Enable selecting save format in form",
    "setting.remember-selection-input.label": "Remember selection and try to apply it next time",
    "setting.autogenerate-clipping-js-input.label": "Autogenerate javascript file",
    "setting.not-generated-yet.label": "Not generated yet",
    "setting.generate-now-msg-sent.label": "Generate command has been sent",
    "setting.generate-now-success.label": "Generate success",
    "setting.last-generate-time.label": "Last generated time",
    "setting.auto-refresh-history-input.label": "Auto refresh history (when you open the browser)",
    "setting.refresh-now-msg-sent.label": "Refresh command has been sent",
    "setting.refresh-now-success.label": "Refresh success",
    "setting.last-refresh-time.label": "Last refreshed time",
    "setting.communicate-with-third-party-input.label": "Communicate with third party",
    "setting.assistant-enabled-input.label": "Enable assistant",
    "setting.auto-update-public-plan-input.label": "Auto update public plan (when you open the browser)",

    "setting.backup-setting-page-config-input.label": "Setting page's configuration",
    "setting.backup-history-page-config-input.label": "History page's configuration",
    "setting.backup-assistant-data-input.label": "Assistant data (subscriptions and plans)",
    "setting.backup-selection-data-input.label": "Remembered selection",


    "setting.last-update-time.label": "Last updated time",
    "setting.update-now-success.label": "Update success",
    "setting.reset-to-default-intro.label": "Reset All items below",
    "setting.reset-to-default-warning.label": "All your settings will be reset to default, are you sure?",
    "setting.reset-to-default-success.label": "Reset success",
    "setting.restore-from-file-success.label": "Restore success",

    // placeholder
    "setting.placeholder.notblank": "This value can not be blank!",


    //=====================================
    // history page
    //=====================================
    "history.placeholder.search": "title or tag or category or original url",
    "history.placeholder.created-at-from": "from date",
    "history.placeholder.created-at-to": "to date",
    "history.placeholder.category": "category",
    "history.placeholder.tag": "tag",
    "history.btn.search": "Search",
    "history.btn.reset": "Reset",
    "history.btn.clear-history": "Clear History",
    "history.btn.export-history": "Export History",
    "history.a.reset-history": "Reset history",

    "history.no-record": "No record.",
    "history.export.no-record": "No record",
    "history.op.delete": "Delete",
    "history.label.confirm-mode": "Confirm before danger operation",
    "history.label.advanced-search-mode": "Advanced search",
    "history.confirm-msg.clear-history": "Clear all history? (this operation won't delete clipping files)",
    "history.confirm-msg.delete-history": "Delete this history? (this operation won't delete clipping files)",
    "history.confirm-msg.delete-history-and-file": "Delete this history and it's files?",

    "clipping.op-error.path-overflow": "The file you want to delete is not inside of data folder, check your configure file (config.yaml) ",
    "clipping.op-error.path-not-exist": "Can't find clipping files",
    "clipping.op-error.json-parse-error": "Failed to parse json",
    "clipping.op-warning.asset-folder-overflow": "The asset folder is outside of data folder, which means native-app won't delete asset files in asset folder. check your configure file (cinfig.yaml)",
    "history.notice.delete-history-success": "Delete success!",
    "history.notice.clear-history-success": "Clear success!",
    "history.notice.delete": "ATTENTION: You can install our Native APP(enhance the abilities of MaoXian) to delete clipping files, otherwise, we delete history record only.",
    "history.error.native-app-version-too-small": "Current version ($VERSION) of Native APP can not handle this message, please upgrade it.",

    //=====================================
    // reset history page
    //=====================================
    "reset.page-name": "Reset History",
    "init.download-folder": 'Loading browser download path...',
    "reset.hint": "Choose storage path, Extension will reset whole history. <br /> If you want to reset history automatically. Try \"refresh history\", see <a href='go.page:extPage.setting#setting-refresh-history' target='_blank'>Setting > Refresh History</a> for more detail",
    "reset.current-storage-path": "Current storage path: ",
    "reset.current-storage-path-value": "<code>download path</code> / <code>$ROOT-FOLDER</code><br /><code>$ROOT-FOLDER</code> is the name of root folder, if this name is different to the folder you'll choose, please go to <a href='go.page:extPage.setting#setting-storage' target='_blank'>Setting &gt; Storage</a> page and change the value of root folder first.",
    "reset.processing": "processing...",
    "reset.completed": "completed, Page closing...",
    "reset.clip-history-success": "clip history reset success, $n records loaded",
    "reset.category-success": "category history reset success, $n records loaded",
    "reset.tag-success": "tag history reset success, $n records loaded",

    //=====================================
    // last clipping result page (lcr)
    //=====================================
    "lcr.label.original-url": "Original URL",
    "lcr.label.file": "File: ",
    "lcr.label.err-msg": "ErrorMessage: ",
    "lcr.notice.not-clipping-result": "Last clipping result is empty",
    "lcr.notice.openable-url": "You can click url below to see this clipping.",
    "lcr.notice.can-not-open-file-url": "You can not open this url directly. Becase extension is not allowed to open it, see <strong>Setting Page > File Url</strong> for more detail",
    "lcr.notice.copy-url": "If you can't open the url above, using the following input box to copy it",
    "lcr.message.failed-task-num": "There are $num failures occured in this clipping.",
    "lcr.message.help": "You can retry saving these files on <a href='go.page:extPage.failed-tasks' target='_blank'>Failed Tasks</a> page",



    //=====================================
    // entry(btn & hint)
    //=====================================
    "switch.title": "Switch (hotkey: c)",
    "hint.selecting": "Click or press 'Enter' to select.",
    "hint.selected": "Press 'Enter' to Confirm, Use arrow key to adjust",
    "hint.clipping": "Clipping...",
    "hint.clipped": "Clipped...",

    "hint.saving.started": "Start Save clipping...",
    "hint.saving.progress": "Progress...($finished/$total)",
    "hint.saving.completed": "Completed",

    //help
    "hotkey.help-message": "Help message, click screen to hide it.",
    "hotkey.left.intro": "Expand selection",
    "hotkey.right.intro": "Shrink selection",
    "hotkey.up.intro": "Select forward",
    "hotkey.down.intro": "Select backward",
    "hotkey.esc.intro": "Back to previous step",
    "hotkey.enter.intro": "Confirm selection",
    "hotkey.delete.intro": "Remove selected element",
    "hotkey.scroll.intro": "Click selection to scroll to top/bottom",
    "hotkey.adjust.intro": "Show arrow button",
    "hotkey.back.intro": "Back to previous buttons",
    "hotkey.help.intro": "Show this help messages",

    // form
    "save-format": "Format",
    "title": "Title",
    "category": "Category",
    "tags": "Tags",
    "hint.category": "Subcategory use '/', eg: It/js",
    "hint.tags": "Tag is seperate by space or comma",
    "save": "Save",
    "cancel": "Cancel",

    //=====================================
    // output
    //=====================================
    "original-url": "Original url",
    "access": "Access",
    "created-at": "Created at",

    //=====================================
    // plan subscription page
    //=====================================
    "plan-subscription.page-title": "Subscription detail",
    "plan-subscription.title.subscription": "Base Information",
    "plan-subscription.title.plans": "Plans",

    //=====================================
    // failed tasks page
    //=====================================
    "failed-tasks.btn.retry-all": 'Retry All',
    "failed-tasks.btn.edit-all": 'Edit All',
    "failed-tasks.btn.remove": 'Remove',

    "failed-tasks.label.timeout": 'Timeout: ',
    "failed-tasks.label.tries": 'Maximum Tries: ',

    "failed-tasks.notice.intro": 'This page collects all failed tasks (files that failed to save). These failures may cause by nework problems or timeout of HTTP requests, you can use this page to retry saving these tasks. Try increase "Timeout" and "Maximum Tries" using the folowing form. after that, click the "Retry All" button',

  }};

  export default LocaleEn;
