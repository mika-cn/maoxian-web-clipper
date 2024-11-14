(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "nav.extension-pages": "Extension Pages",
    "nav.external-pages": "External Pages",
    "version": "Current Version",
    // extension pages
    "page.home": "Extension Home Page",
    "page.setting": "Setting",
    "page.history": "History",
    "page.reset-history": "Reset history",
    "page.welcome": "Welcome",
    "page.debug": "Debugging information",
    "page.failed-tasks": "Failed tasks",

    "desc.welcome": "This is the popup page after your installation",
    "desc.setting": "Setting: save format, save path etc.",
    "desc.history": "Where to see what you have clipped.",
    "desc.reset-history": "Where you reset your clipping history when you install MaoXian in a new device.",
    "desc.debug": "This page contains technical information that might be useful when you’re trying to solve a problem or report a bug",
    "desc.failed-tasks": "This page collect all failed tasks (files that failed to save), you can retry saving these tasks on this page.",

    // external pages
    "page.external.home": "Home",
    "page.external.faq": "FAQ",
    "page.external.assistant": "MaoXian Asistant",
    "page.external.native-app": "Native Application",
    "page.external.offline-page": "Offline Index Page",
    "page.external.project.index": "project source code",
    "page.external.project.issue": "Issue page",

    "desc.external.home": "Home page of website",
    "desc.external.faq": "Frequently Asked Question",
    "desc.external.assistant": "The assistant function can help you modify the state of the web page before the clipping, So you can get a better clipped result",
    "desc.external.native-app": "A native application that can enhance the abilities of MaoXian",
    "desc.external.offline-page": "A static HTML page which can be used to browse your clippings without MaoXian or network",
    "desc.external.project.index": "This is the project page of Maoxian. yes, it's open source.",
    "desc.external.project.issue": "Where you giving suggestions or reporting bugs",
  };
  return { values: Object.assign({}, currValues, values) }
});
