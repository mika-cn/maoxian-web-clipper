(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "menu.clip": "裁剪",
    "menu.history": "历史",
    "menu.setting": "设置",
    "menu.home": "主页",
    "menu.last-result": "查看结果",
    "menu.debug": "调试",
  };
  return { values: Object.assign({}, currValues, values) }
});
