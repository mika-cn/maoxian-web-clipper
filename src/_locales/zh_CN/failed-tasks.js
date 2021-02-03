(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "btn.retry-all": '重试所有',
    "btn.edit-all": '编辑所有',
    "btn.remove": '移除',

    "label.timeout": '超时时长：',
    "label.tries": '最大尝试次数：',

    "notice.intro": "这个页面收集了所有保存失败的存储任务（每个存储任务表示一个需要保存的文件）。这些任务可能由于网络问题或请求超时而失败，你可以在该页面对这些任务进行重新保存。请使用下方的表单增大「超时时长」和「最大尝试次数」，再点击「重试所有」按钮。",
    "confirm-msg.remove-task": "确定永久移除该存储任务？",
  };
  return { values: Object.assign({}, currValues, values) }
});
