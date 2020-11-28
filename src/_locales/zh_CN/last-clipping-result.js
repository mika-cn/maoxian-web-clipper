(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "label.original-url": "网页网址",
    "label.file": "文件：",
    "label.err-msg": "错误信息：",
    "notice.not-clipping-result": "无内容可查看",
    "notice.openable-url": "你可点击下方链接查看该裁剪结果.",
    "notice.can-not-open-file-url": "你无法直接打开该链接. 因为扩展不被允许打开该类型的链接, 查看 <strong>设置页 > 本地网址</strong> 获取关于此的更多信息",
    "notice.copy-url": "如果你无法打开上方网址，则用下面的输入框帮你复制它",
    "message.failed-task-num": "本次裁剪过程中，有 $num 个资源保存失败.",
    "message.help": "你可以在「<a href='go.page:extPage.failed-tasks' target='_blank'>失败的存储任务</a>」页面重试保存这些文件。",
  };
  return { values: Object.assign({}, currValues, values) }
});
