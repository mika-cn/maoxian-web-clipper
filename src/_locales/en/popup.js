(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "menu.clip-as-default": "Clip",
    "menu.clip-as-html": "HTML",
    "menu.clip-as-md": "Markdown",
    "menu.history": "History",
    "menu.settings": "Settings",
    "menu.home": "Home",
    "menu.last-result": "Show result",
    "menu.debug": "Debug",

    "menu.hint.clip-as-default": "Clip as default format",
    "menu.hint.clip-as-html": "Clip as HTML format",
    "menu.hint.clip-as-md": "Clip as Markdown format",
    "menu.hint.history": "Clipping history",
    "menu.hint.settings": "Config MaoXian",
    "menu.hint.home": "Find links",
    "menu.hint.last-result": "Show last clipping result",
    "menu.hint.debug": "Troubleshooting information",
  };
  return { values: Object.assign({}, currValues, values) }
});
