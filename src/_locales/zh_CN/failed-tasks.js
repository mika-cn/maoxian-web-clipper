(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "failed-tasks.btn.retry-all": '重试所有',
    "failed-tasks.btn.edit-all": '编辑所有',
    "failed-tasks.btn.remove": '移除',

    "failed-tasks.label.timeout": '超时时长：',
    "failed-tasks.label.tries": '最大尝试次数：',

    "failed-tasks.notice.intro": "这个页面收集了所有保存失败的存储任务（每个存储任务表示一个需要保存的文件）。这些任务可能由于网络问题或请求超时而失败，你可以在该页面对这些任务进行重新保存。请使用下方的表单增大「超时时长」和「最大尝试次数」，再点击「重试所有」按钮。",
  };
  return { values: Object.assign({}, currValues, values) }
});
