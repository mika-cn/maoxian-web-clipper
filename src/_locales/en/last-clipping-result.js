(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "label.original-url": "Original URL",
    "label.file": "File: ",
    "label.err-msg": "ErrorMessage: ",
    "notice.not-clipping-result": "Last clipping result is empty",
    "notice.openable-url": "You can click url below to see this clipping.",
    "notice.can-not-open-file-url": "You can not open this url directly. Becase extension is not allowed to open it, see <strong>Setting Page > File Url</strong> for more detail",
    "notice.copy-url": "If you can't open the url above, using the following input box to copy it",
    "message.failed-task-num": "There are $num failures occured in this clipping.",
    "message.help": "You can retry saving these files on <a href='go.page:extPage.failed-tasks' target='_blank'>Failed Tasks</a> page",
  };
  return { values: Object.assign({}, currValues, values) }
});
