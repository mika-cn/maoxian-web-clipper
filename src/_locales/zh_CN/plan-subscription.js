(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "page-title": "订阅详情",
    "title.subscription": "基本信息",
    "title.plans": "计划",
    "subscription.name": "名称",
    "subscription.version": "版本",
    "subscription.size": "记录数",
    "subscription.url": "网址",
  };
  return { values: Object.assign({}, currValues, values) }
});
