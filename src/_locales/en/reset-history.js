(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "page-name": "Reset History",
    "init.download-folder": 'Loading browser download path...',
    "hint": "Choose storage path, Extension will reset whole history. <br /> If you want to reset history automatically. Try \"refresh history\", see <a href='go.page:extPage.setting#setting-refresh-history' target='_blank'>Setting > Refresh History</a> for more detail",
    "current-storage-path": "Current storage path: ",
    "current-storage-path-value": "<code>download path</code> / <code>$ROOT-FOLDER</code><br /><code>$ROOT-FOLDER</code> is the name of root folder, if this name is different to the folder you'll choose, please go to <a href='go.page:extPage.setting#setting-storage' target='_blank'>Setting &gt; Storage</a> page and change the value of root folder first.",
    "processing": "processing...",
    "completed": "completed, Page closing...",
    "reset-clip-history-success": "clip history reset success, $n records loaded",
    "reset-category-success": "category history reset success, $n records loaded",
    "reset-tag-success": "tag history reset success, $n records loaded",
  };
  return { values: Object.assign({}, currValues, values) }
});
