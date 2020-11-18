(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "placeholder.search": "title or tag or category or original url",
    "placeholder.created-at-from": "from date",
    "placeholder.created-at-to": "to date",
    "placeholder.category": "category",
    "placeholder.tag": "tag",
    "btn.search": "Search",
    "btn.reset": "Reset",
    "btn.clear-history": "Clear History",
    "btn.export-history": "Export History",
    "btn.reset-history": "Reset history",

    "label.confirm-mode": "Confirm before danger operation",
    "label.advanced-search-mode": "Advanced search",
    "confirm-msg.clear-history": "Clear all history? (this operation won't delete clipping files)",
    "confirm-msg.delete-history": "Delete this history? (this operation won't delete clipping files)",
    "confirm-msg.delete-history-and-file": "Delete this history and it's files?",

    "clipping.op-error.path-overflow": "The file you want to delete is not inside of data folder, check your configure file (config.yaml) ",
    "clipping.op-error.path-not-exist": "Can't find clipping files",
    "clipping.op-error.json-parse-error": "Failed to parse json",
    "clipping.op-warning.asset-folder-overflow": "The asset folder is outside of data folder, which means native-app won't delete asset files in asset folder. check your configure file (cinfig.yaml)",
    "notice.delete-history-success": "Delete success!",
    "notice.clear-history-success": "Clear success!",
    "notice.delete": "ATTENTION: You can install our Native APP(enhance the abilities of MaoXian) to delete clipping files, otherwise, we delete history record only.",
    "error.native-app-version-too-small": "Current version ($VERSION) of Native APP can not handle this message, please upgrade it.",
  };
  return { values: Object.assign({}, currValues, values) }
});
