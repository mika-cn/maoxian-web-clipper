(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "menu.clip": "Clip",
    "menu.history": "History",
    "menu.setting": "Setting",
    "menu.home": "Home",
    "menu.last-result": "Show result",
    "menu.debug": "Debug",
  };
  return { values: Object.assign({}, currValues, values) }
});
