(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "page-name": "Synchronize User Script",
    "hint": 'Choose the directory that contains user scripts to synchronize.<br><br><a href="go.page:write-user-script" target="_blank">How to write user scripts</a>',
    "done": "Done! synchronized $n scripts",
    "close-page": "This page will close in 3 seconds",
  };
  return { values: Object.assign({}, currValues, values) }
});
