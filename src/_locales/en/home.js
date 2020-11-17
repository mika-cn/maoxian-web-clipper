(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "nav.extension-pages": "Extension Pages",
    "nav.remote-pages": "Remote Pages",
    "version": "Current Version",
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
  };
  return { values: Object.assign({}, currValues, values) }
});
