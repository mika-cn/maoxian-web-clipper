(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "page-title": "用户脚本详情",
    "title.metas": "元信息",
    "title.code": "源代码",
    "user-script.name": "名字",
    "user-script.version": "版本",
    "user-script.author": "作者",
    "user-script.description": "简介",
  };
  return { values: Object.assign({}, currValues, values) }
});
