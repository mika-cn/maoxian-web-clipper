var I18N_DICT = I18N_DICT || {};

I18N_DICT['en'] = {
  "values": {
    "name": "MaoXian web clipper",

    //base
    "none": "none",
    "btn.confirm": "Confirm",

    "op.update-success": "Update Success!",
    "op.delete-success": "Delete Success!",

    //home page
    "page.home": "Extension Home Page",
    "page.setting": "Setting",
    "page.history": "History",
    "page.reset-history": "Reset history",
    "page.support": "Support",

    //popup
    "popup.menu.clip": "Clip",
    "popup.menu.history": "History",
    "popup.menu.setting": "Setting",
    "popup.menu.home": "Home",
    "popup.menu.last-result": "Show result",

    //welcome page
    "welcome.installation-hint": "MaoXian Web Clipper $version has been installed",
    "welcome.sayhi": "Welcome!",
    "welcome.extra-intro": "Before you start, please take these two extra steps to ensure better experience with MaoXian.",
    "welcome.extra-1-chrome": "1. Turn off Chrome's Save As dialog so that you won't be asked where to save file for every download.<br />This can be done by clearing the checkbox before <strong><a href='' link='chrome://settings/downloads' class='tab-link'>chrome://settings</a></strong> &gt; <i>Downloads</i> &gt; <i>Ask where to save each file before downloading</i>",
    "welcome.extra-1-firefox": "1. Turn off Firefox's Save As dialog so that you won't be asked where to save fille for every download.<br />This can be done by clearing the radio-button before <strong>about:preferences</strong> &gt; <i>Downloads</i> &gt; <i>Always ask you where to save files</i>",
    "welcome.extra-2-chrome": "2. Allow MaoXian to access file URLs for fast file preview, by ticking the checkbox <i>Allow access to file URLs</i> on <strong>$extensionLink</strong>.",
    "welcome.extra-2-firefox": "2. Allow MaoXian to access file URLs for fast file preview, see <strong>$allowFileUrlAccessLink</strong>",
    "welcome.notice": "<strong class='green'>Notice:</strong> If you want to clip a page before MaoXian's installation. Reload it first!",
    "welcome.last-hint": 'If you have any question, please visit our $faqLink page</p>',


    //setting page
    "setting.warning": "Warning",

    // title
    "setting.title.save-format": "Save Format",
    "setting.title.hotkey": "Hotkey",
    "setting.title.file-url": "File URL",
    "setting.title.clipping-content": "Clipping Content",
    "setting.title.path": "Path",
    "setting.title.clipping-handler": "Clipping Handler",
    "setting.title.other": "Others",
    "setting.title.offline-page": "Offline Index Page",

    // buttons
    "setting.button.generate-now": "Generate Now",

    // notice
    "setting.notice.file-url.intro": "This item is to tell extension that your allow it to access file URLs (file://).",
    "setting.notice.file-url.link-label": "Learn how to setting",
    "setting.notice.file-url.help-msg": "Your will need message below:",
    "setting.notice.file-url.ext-id": "Extension identify",
    "setting.notice.file-url-warning": "This item will not change your browser's setting.<br />Only check this after your allow browser to access file URLs.",
    "setting.notice.default-category": "<strong>Default Category</strong><br />Use <strong>/</strong> to separate sub category<br />Use <strong>$NONE</strong> to represent empty value",
    "setting.notice.default-clipping-folder-format": "<strong>Default Clipping Folder Format</strong><br /><strong>$FORMAT-A</strong> =&gt; 2018-10-11-1539236251 <br /><strong>$FORMAT-B</strong> =&gt; 20181011102009 <br /><strong>$FORMAT-C</strong> =&gt; 1539236251 <br />",
    "setting.notice.title-clipping-folder-format": "<strong>Title Clipping Folder Format</strong><br /><strong>$FORMAT-A</strong> =&gt; <code>default-clipping-folder</code> + <code>-</code> + <code>title</code><br />First part (<i>default-clipping-folder</i>) depends on <strong>Default Clipping Folder Format</strong> you configure.<br />Last part (<i>title</i>) is the title you input when clipping.<br />e.g. 2018-10-11-1539236251-a-awesome-title<br /><strong>$FORMAT-B</strong> =&gt; <code>title</code><br />e.g. a-awesome-title<br /><strong>Warning</strong>: $FORMAT-B may cause clipping overwrite, if your clippings have same title. ",
    "setting.notice.asset-path": "<strong>Asset Path (image,font...)</strong><br />Use <strong>$CLIP-FOLD</strong> to represent cliping folder that generate from extension<br />Use <strong>$MX-WC</strong> to represent extension root folder ($downloads/mx-wc)",
    "setting.notice.clipping-handler.intro": "<strong>Download through browser</strong><br />Use browser to download clipping result.<br /><br /><strong>Download through native App</strong><br />Use a native application to download clipping result ( If you already install some download manage extension, your can choose this option to avoid conflic between extension), You need to install a native application.",
    "setting.notice.clipping-handler.warning": "<strong> Warning! </strong><br /> If you choose native application as your clipping handler, you must install native application first.",
    "setting.notice.clipping-handler.link-label": "install native App",
    "setting.notice.offline-page": "Offline index page is a static HTML page which can be used to browse your clippings without MaoXian Web Clipper or network. ",
    "setting.notice.offline-page.link-label": "Learn more detail",
    "setting.notice.autogenerate-clipping-js": "<strong>Autogenerate Javascript File</strong><br />Everytime when you clipping a web page, or delete a clipping history, MaoXian will generate a javascript file contains all your clippings and save to the path you configure. this script file will be accessed by offline web page that you downloaded.",
    "setting.notice.clipping-js-path": "<strong>Clipping javascript Path</strong><br />Where to save clipping javascript file. <br />Use <strong>$MX-WC</strong> to represent extension root folder ($downloads/mx-wc)",

    // label
    "setting.file-url-input.label": "I enabled 'allow file scheme access' ",
    "setting.clip-information-input.label": "Include clipping information (original url, time, category and tags)",
    "setting.save-web-font-input.label": "Save web fonts(suggest uncheck it)",
    "setting.save-domain-tag-input.label": "Save current domain as tag",
    "setting.save-title-as-fold-name-input.label": "Use title as clipping folder name (default: Generate by extension)",
    "setting.save-title-as-filename-input.label": "Use title as filename (default: index.html or index.md)",
    "setting.enable-switch-hotkey-input.label": "Enable hotkey `c` (clip switch)",
    "setting.enable-mouse-mode-input.label": "Mouse frindly mode",
    "setting.autogenerate-clipping-js-input.label": "Autogenerate javascript file",
    "setting.not-generated-yet.label": "Not generated yet",
    "setting.generate-now-msg-sent.label": "Autogenerate command has been sent",
    "setting.last-generate-time.label": "Last generated time",

    // placeholder
    "setting.placeholder.notblank": "This value can not blank!",

    // setting options
    "setting.clipping-handler-option.browser": "Download through browser",
    "setting.clipping-handler-option.native-app": "Download through native App",


    //history page
    "history.placeholder.search": "title or tag or category",
    "history.placeholder.created-at-from": "from date",
    "history.placeholder.created-at-to": "to date",
    "history.placeholder.category": "category",
    "history.placeholder.tag": "tag",
    "history.btn.search": "Search",
    "history.btn.reset": "Reset",
    "history.btn.clear-history": "Clear History",
    "history.btn.export-history": "Export History",
    "history.a.reset_history": "Reset history",
    "history.th.title": "Title",
    "history.th.path": "Path",
    "history.th.time": "Time",
    "history.th.category": "Category",
    "history.th.tag": "Tag",
    "history.th.format": "Format",
    "history.no_record": "No record.",
    "history.export.no-record": "No record",
    "history.op.delete": "Delete",
    "history.label.confirm-mode": "Confirm before danger operation",
    "history.label.advanced-search-mode": "Advanced search",
    "history.confirm-msg.clear-history": "Clear all history? (this operation won't delete clipping files)",
    "history.confirm-msg.delete-history": "Delete this history? (this operation won't delete clipping files)",
    "history.confirm-msg.delete-history-and-file": "Delete this history and it's files?",

    "clipping.op-error.path-overflow": "The file you want to delete is not inside of data folder, check your configure file (config.yaml) ",
    "clipping.op-error.path-not-exist": "Can't find clipping files",
    "clipping.op-warning.asset-fold-overflow": "The asset folder is outside of data folder, which means native-app won't delete asset files in asset folder. check your configure file (cinfig.yaml)",
    "history.notice.delete-history-success": "Delete success!",
    "history.notice.clear-history-success": "Clear success!",
    "history.notice.delete": "ATTENTION: You can install our Native APP(enhance the abilities of MaoXian) to delete clipping files, otherwise, we delete history record only.",

    //reset history page
    "init.downloadFold": 'Loading browser download path...',
    "reset.hint": 'Choose clip directory("$downloads/mx-wc"), Extension will reset whole history.',
    "reset.processing": "processing...",
    "reset.completed": "completed, Page closing...",
    "reset.clip_history_success": "clip history reset success, $n records loaded",
    "reset.category_success": "category history reset success, $n records loaded",
    "reset.tag_success": "tag history reset success, $n records loaded",



    // entry(btn & hint)
    "switch.title": "Switch (hotkey: c)",
    "hint.selecting": "Move cursor, click to select.",
    "hint.selected": "Press 'Enter' to Confirm, Use arrow key to adjust",
    "hint.downloading": "Downloading...",

    //help
    "hotkey.left.intro": "Expand selection",
    "hotkey.right.intro": "Shrink selection",
    "hotkey.up.intro": "Select forward",
    "hotkey.down.intro": "Select backward",
    "hotkey.esc.intro": "Back to free mode",
    "hotkey.enter.intro": "Confirm selection",
    "hotkey.scroll.intro": "Scroll to selection's top/bottom",
    "hotkey.scroll.name": "Click",

    // form
    "title": "Title",
    "category": "Category",
    "tags": "Tags",
    "hint.category": "Subcategory use '/', eg: It/js",
    "hint.tags": "Tag is seperate by space or comma",
    "save": "Save",
    "cancel": "Cancel",

    //output
    "original_url": "Original url",
    "access": "Access",
    "created_at": "Created at",

    //notifications
    "notification.title": "Message Center",
    "notification.hint": "Click message to delete it",
    "notification.native-app-version-too-small": "Native Application version must >= $requiredVersion, But current installed version is $currentVersion, please update your native application",
    "notification.native-app-connect-failed": "You configure native application as your clipping handler but you haven't install it correctly! (error message: $errorMessage)"

  }
};
