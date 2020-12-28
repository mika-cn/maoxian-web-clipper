(function (root, factory) {
  root.MxWcI18N_en = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_en || {}).values || {};
  const values = {
    "btn.retry-all": 'Retry All',
    "btn.edit-all": 'Edit All',
    "btn.remove": 'Remove',

    "label.timeout": 'Timeout: ',
    "label.tries": 'Maximum Tries: ',

    "notice.intro": 'This page collects all failed tasks (files that failed to save). These failures may cause by nework problems or timeout of HTTP requests, you can use this page to retry saving these tasks. Try increase "Timeout" and "Maximum Tries" using the folowing form. after that, click the "Retry All" button',
    "confirm-msg.remove-task": "Are you sure? You can NOT undo this operation!",
  };
  return { values: Object.assign({}, currValues, values) }
});
