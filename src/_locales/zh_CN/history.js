(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "placeholder.search": "可搜索标题、标签、目录、源网址",
    "placeholder.created-at-from": "起始日期",
    "placeholder.created-at-to": "结束日期",
    "placeholder.category": "目录",
    "placeholder.tag": "标签",
    "btn.search": "搜索",
    "btn.reset": "重置",
    "btn.clear-history": "清除历史",
    "btn.export-history": "导出历史",
    "btn.reset-history": "重置历史",

    "label.confirm-mode": "危险操作需确认",
    "label.advanced-search-mode": "高级搜索",
    "confirm-msg.clear-history": "确认清除所有历史记录？（该操作不会删除对应的文件）",
    "confirm-msg.delete-history": "确认删除这条历史记录? （该操作不会删除对应的文件）",
    "confirm-msg.delete-history-and-file": "确认删除这条历史记录，以及对应的文件？",

    "clipping.op-error.path-overflow": "要删除的文件不在裁剪目录下，请检查你本地程序的配置文件(config.yaml) ",
    "clipping.op-error.path-not-exist": "找不到要删除的文件",
    "clipping.op-error.json-parse-error": "JSON 解析失败",
    "clipping.op-warning.asset-folder-overflow": "你当前配置的资源目录不在裁剪目录下，这会造成某些资源文件删除不干净的问题，请检查你本地程序的配置文件(config.yaml) ",
    "notice.delete-history-success": "删除成功!",
    "notice.clear-history-success": "清除成功!",
    "notice.delete": "温馨提示： 只有安装了「本地程序」，本页面提供的删除功能才会删除你本地的文件。",
    "error.native-app-version-too-small": "「本地程序」的当前版本（$VERSION） 无法处理该消息, 请升级「本地程序」.",
  };
  return { values: Object.assign({}, currValues, values) }
});
