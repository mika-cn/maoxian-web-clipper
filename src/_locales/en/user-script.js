(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "page-title": "User Script Details",
    "title.metas": "Metas",
    "title.code": "Source Code",
    "user-script.name": "Name",
    "user-script.version": "Version",
    "user-script.author": "Author",
    "user-script.description": "Description",
  };
  return { values: Object.assign({}, currValues, values) }
});
