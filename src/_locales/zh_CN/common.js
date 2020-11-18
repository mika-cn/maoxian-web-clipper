(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    // clipping attributes
    "g.clipping.title": "标题",
    "g.clipping.path": "路径",
    "g.clipping.time": "时间",
    "g.clipping.category": "目录",
    "g.clipping.tag": "标签",
    "g.clipping.tags": "标签",
    "g.clipping.format": "格式",
    "g.clipping.original-url": "原网址",
    "g.clipping.created-at": "创建时间",

    // task attributes
    "g.task.clipId": "Clipping ID",
    "g.task.clip-id": "Clipping ID",
    "g.task.filename": "文件名",
    "g.task.timeout": "超时时长",
    "g.task.tries": "最大尝试次数",
    "g.task.createdAt": "创建时间",
    "g.task.filenameAndUrl": "文件名和网址",

    // button labels
    "g.btn.save": "保存",
    "g.btn.confirm": "确认",
    "g.btn.delete": "删除",
    "g.btn.cancel": "取消",

    // labels
    "g.label.none": "无",
    "g.label.access": "访问",
    "g.label.warning": "警告",

    // hint
    "g.hint.no-record": "没有记录",
    "g.hint.saved": "已保存",
    "g.hint.update-success": "更新成功!",
    "g.hint.delete-success": "删除成功!",

    // options
    "g.option-value.html": "HTML",
    "g.option-value.md": "Markdown",

    // errors
    "g.error.value-invalid": "输入值无效",
    "g.error.not-a-number": "输入值不是数字",
    "g.error.not-in-allowed-range": "输入值不在允许范围之内",

    "g.error.handler.not-enabled": "处理程序未启用",
    "g.error.handler.not-ready": "处理程序处于不可用状态",
    "g.error.handler.native-app.version": "当前扩展依赖的「本地程序」的版本必须大于或等于 $requiredVersion, 但是当前安装的版本为 $currentVersion，请<a href='go-page:native-app#upgrade' target='_blank'>更新你的本地程序</a>",
    "g.error.handler.native-app.install": "可能是由于你的「本地程序」还没有安装或者安装未成功导致的 (<a href='go.page:native-app' target='_blank'>查看如何安装</a>)",

  };
  return { values: Object.assign({}, currValues, values) }
});
