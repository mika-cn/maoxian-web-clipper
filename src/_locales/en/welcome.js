(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "installation-hint": "MaoXian Web Clipper $version has been installed",
    "sayhi": "Welcome!",
    "extra-intro": "Before you start, please take these two extra steps to ensure better experience with MaoXian.",
    "extra-1-chrome": "1. Turn off Chrome's Save As dialog so that you won't be asked where to save file for every download.<br />This can be done by clearing the checkbox before <strong><a href='' link='chrome://settings/downloads' class='tab-link'>chrome://settings</a></strong> &gt; <i>Downloads</i> &gt; <i>Ask where to save each file before downloading</i>",
    "extra-1-firefox": "1. Turn off Firefox's Save As dialog so that you won't be asked where to save fille for every download.<br />This can be done by clearing the radio-button before <strong>about:preferences</strong> &gt; <i>Downloads</i> &gt; <i>Always ask you where to save files</i>",
    "extra-2-chrome": "2. Allow MaoXian to access file URLs for fast file preview, by ticking the checkbox <i>Allow access to file URLs</i> on <strong>$extensionLink</strong>.",
    "extra-2-firefox": "2. Allow MaoXian to access file URLs for fast file preview, see <strong><a href='go.page:faq-allow-access-file-urls' target='_blank'>Allow Access File URLs</a></strong>",
    "notice": "<strong class='green'>Notice:</strong> If you want to clip a page before MaoXian's installation. Reload it first!",
    "last-hint": "If you have any question, please visit our <a href='go.page:faq' target='_blank'>FAQ</a> page</p>",
  };
  return { values: Object.assign({}, currValues, values) }
});
