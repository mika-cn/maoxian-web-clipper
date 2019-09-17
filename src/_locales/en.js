;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcLocaleEn', [], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory();
  } else {
    // browser or other
    root.MxWcLocaleEn = factory();
  }
})(this, function(undefined) {
  "use strict";

  return  {
  "values": {
    "name": "MaoXian web clipper",

    //=====================================
    // global
    //=====================================
    "none": "none",
    "btn.confirm": "Confirm",

    "op.update-success": "Update Success!",
    "op.delete-success": "Delete Success!",

    // options
    "option.save-format.html.name": "HTML",
    "option.save-format.md.name": "Markdown",

    // errors
    "error.not-a-number": "Input value is not a number",
    "error.not-in-allowed-range": "Input value is not in allowed range",


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

    "desc.setting": "Setting: save format, save path etc.",
    "desc.history": "Where to see what you have clipped.",
    "desc.reset-history": "Where you reset your clipping history when you install MaoXian in a new device.",
    "desc.support": "This page contains technical information that might be useful when you’re trying to solve a problem or report a bug",

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
    "welcome.last-hint": "If you have any question, please visit our <a href='go.page:faq'>FAQ</a> page</p>",


    //=====================================
    // setting page
    //=====================================
    "setting.warning": "Warning",
    "setting.version": "Current version: ",

    // errors
    "error.handler.not-enabled": "Handler is disabled",
    "error.handler.not-ready": "Handler is not ready",

    // title
    "setting.title.intro": "Intro",
    "setting.title.feature": "Features",
    "setting.title.status": "Status",
    "setting.title.detail": "Detail",

    "setting.title.general": "General",
    "setting.title.storage": "Storage",
    "setting.title.handler": "Handler",
    "setting.title.handler-browser": "Browser",
    "setting.title.handler-native-app": "Native App",
    "setting.title.handler-wiz-note-plus" :"WizNotePlus",

    "setting.title.save-format": "Save Format",
    "setting.title.control": "Control",
    "setting.title.file-url": "File URL",
    "setting.title.advanced": "Advanced",
    "setting.title.request": "HTTP Request",
    "setting.title.misc": "Misc",
    "setting.title.clipping-content": "Clipping Content",
    "setting.title.offline-page": "Offline Index Page",
    "setting.title.refresh-history": "Refresh History",
    "setting.title.default-clipping-folder-format": "Default Clipping Folder Format",
    "setting.title.title-style-clipping-folder-format": "Title Style Clipping Folder Format",
    "setting.title.title-style-clipping-folder": "Title Style Clipping Folder",
    "setting.title.clipping-file": "Main file",
    "setting.title.asset-path": "Asset Path",
    "setting.title.default-category": "Default Category",
    "setting.title.path": "Path",
    "setting.title.root-folder": "Root Folder",

    "setting.path-intro.format": "Format: ",

    "setting.path.download": "download path",
    "setting.path.filename": "filename of main file",
    "setting.folder.root": "root folder",
    "setting.folder.category": "category folder",
    "setting.folder.clipping": "clipping folder",

    "setting.path.download.intro": "download path： Download location of your browser, If you use NativeApp to save clipping file, this path is the value of \"data_dir\" in configure file (config.yaml) of NativeApp.",
    "setting.path.filename.intro": "filename of main file： The filename of main file (entry file), default is <code>index.html</code> or <code>index.md</code>.",
    "setting.folder.root.intro": "root folder： This is the storage root, all clipping files will storage under this folder.",
    "setting.folder.category.intro": "category folder: This part is used to category your clippings. It's value depends on what you input in saving form. Let's assume your input value is <code>news/sports</code>, then extension will create a folder named <code>news</code> and a subfolder named <code>sports</code>.",
    "setting.folder.clipping.intro": "clpping folder： Extension creates a clipping folder in every clipping, and saves clipping files inside it.",

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

    "setting.option.default-clipping-folder-format.a": "Format A (e.g. 2018-10-11-1539236251)",
    "setting.option.default-clipping-folder-format.b": "Format B (e.g. 20181011102009)",
    "setting.option.default-clipping-folder-format.c": "Format C (e.g. 1539236251)",

    "setting.option.title-style-clipping-folder-format.a": "Format A",
    "setting.option.title-style-clipping-folder-format.b": "Format B",



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

    // notice
    "setting.notice.file-url.intro": "This item is to tell extension that your allow it to access file URLs (file://).",
    "setting.notice.file-url.link-label": "Learn how to setting",
    "setting.notice.file-url.help-msg": "Your will need message below:",
    "setting.notice.file-url.ext-id": "Extension identify",
    "setting.notice.file-url-warning": "This item will not change your browser's setting.<br />Only check this after you allow browser to access file URLs.",
    "setting.notice.root-folder": "<strong>Notice:</strong><br /> This folder is used as storage entry, We suggest you don't change it after you set it right. If you do want to change it, you should change the name of folder in your file system too. So that you won't get two storage entry.",
    "setting.notice.default-category": "<strong>Default Category</strong><br />Use <strong>/</strong> to separate sub category<br />Use <strong>$NONE</strong> to represent empty value<br />Use <strong>$DOMAIN</strong> to represent current domain",
    "setting.notice.title-clipping-folder-format": "<strong>Format A</strong> =&gt; <code>default-clipping-folder</code> + <code>-</code> + <code>title</code><br />First part (<i>default-clipping-folder</i>) depends on <strong>Default Clipping Folder Format</strong> you configure.<br />Last part (<i>title</i>) is the title you input when clipping.<br />e.g. 2018-10-11-1539236251-a-awesome-title<br /><br /><strong>Format B</strong> =&gt; <code>title</code><br />e.g. a-awesome-title<br /><strong>Warning</strong>: <em>Format B</em> may cause clipping overwrite, if your clippings have same title. ",
    "setting.notice.asset-path": "<strong>Asset Path (image,font,style...)</strong><br />Use <strong>$CLIPPING-PATH</strong> to represent <code>download path</code> / <code>root folder</code> / <code>category folder</code> / <code>clipping folder</code><br />Use <strong>$STORAGE-PATH</strong> to represent <code>download path</code> / <code>root folder</code>",
    "setting.notice.clipping-handler.link-label": "install native App",
    "setting.notice.offline-page": "Offline index page is a static HTML page which can be used to browse your clippings without MaoXian Web Clipper or network. ",
    "setting.notice.offline-page.link-label": "Learn more detail",
    "setting.notice.autogenerate-clipping-js": "<strong>Autogenerate Javascript File</strong><br />Everytime when you clip a web page, or delete a clipping history, MaoXian will generate a javascript file contains all your clippings and save to the path you configure. this script file will be accessed by offline web page that you downloaded.",
    "setting.notice.clipping-js-path": "<strong>Clipping javascript Path</strong><br />Where to save clipping javascript file. <br />Use <strong>$STORAGE-PATH</strong> to represent <code>download path</code> / <code>root folder</code>",
    "setting.notice.refresh-history": "This is useful when you have two clipping sources(e.g. two browsers on same computer or different computers) and want to keep clipping history latest.",


    // label
    "setting.enable-handler.label": "Enable this handler",
    "setting.file-url-input.label": "I enabled 'allow file scheme access' ",
    "setting.request-timeout-input.label": "Timeout for performing a request (secs, 5~240)",
    "setting.clip-information-input.label": "Include clipping information (original url, time, category and tags) in main file",
    "setting.save-web-font-input.label": "Save web fonts (not recommended)",
    "setting.save-css-image-input.label": "Save CSS background images (not recommended)",
    "setting.save-domain-tag-input.label": "Save current domain as tag",
    "setting.title-style-clipping-folder-enabled-input.label": "Enable title style clipping folder",
    "setting.save-title-as-filename-input.label": "Use title as filename (default: index.html or index.md)",
    "setting.hotkey-switch-enabled-input.label": "Enable hotkey `c` (clip switch)",
    "setting.mouse-mode-enabled-input.label": "Mouse friendly mode",
    "setting.input-field-save-format-enabled.label": "Enable selecting save format in form",
    "setting.autogenerate-clipping-js-input.label": "Autogenerate javascript file",
    "setting.not-generated-yet.label": "Not generated yet",
    "setting.generate-now-msg-sent.label": "Generate command has been sent",
    "setting.generate-now-success.label": "Generate success",
    "setting.last-generate-time.label": "Last generated time",
    "setting.auto-refresh-history-input.label": "Auto refresh history (when you open the browser)",
    "setting.refresh-now-msg-sent.label": "Refresh command has been sent",
    "setting.refresh-now-success.label": "Refresh success",
    "setting.last-refresh-time.label": "Last refreshed time",
    "setting.dispatch-public-event-input.label": "Dispatch public event",
    "setting.communicate-with-third-party-input.label": "Communicate with third party",

    // placeholder
    "setting.placeholder.notblank": "This value can not blank!",


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
    "history.th.title": "Title",
    "history.th.path": "Path",
    "history.th.original-url": "From",
    "history.th.time": "Time",
    "history.th.category": "Category",
    "history.th.tag": "Tag",
    "history.th.format": "Format",
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
    "clipping.op-warning.asset-folder-overflow": "The asset folder is outside of data folder, which means native-app won't delete asset files in asset folder. check your configure file (cinfig.yaml)",
    "history.notice.delete-history-success": "Delete success!",
    "history.notice.clear-history-success": "Clear success!",
    "history.notice.delete": "ATTENTION: You can install our Native APP(enhance the abilities of MaoXian) to delete clipping files, otherwise, we delete history record only.",

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
    "lcr.label.file": "File: ",
    "lcr.label.err-msg": "ErrorMessage: ",
    "lcr.notice.not-clipping-result": "Last clipping result is empty",
    "lcr.notice.openable-url": "You can click url below to see this clipping.",
    "lcr.notice.can-not-open-file-url": "You can not open this url directly. Becase extension is not allowed to open it, see <strong>Setting Page > File Url</strong> for more detail",
    "lcr.message.failed-task-num": "There are $num failures occured in this clipping.",



    //=====================================
    // entry(btn & hint)
    //=====================================
    "switch.title": "Switch (hotkey: c)",
    "hint.selecting": "Click or press 'Enter' to select.",
    "hint.selected": "Press 'Enter' to Confirm, Use arrow key to adjust",
    "hint.clipping": "Clipping...",

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
    // notifications page
    //=====================================
    "notification.title": "Message Center",
    "notification.hint": "Click message to delete it",

  }};
});
