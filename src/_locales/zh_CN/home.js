(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "nav.extension-pages": "扩展页面",
    "nav.remote-pages": "网站页面",
    "version": "当前版本",
    // extension pages
    "page.home": "扩展主页",
    "page.setting": "设置",
    "page.history": "历史",
    "page.reset-history": "重置历史",
    "page.support": "支持页",
    "page.failed-tasks": "失败的存储任务",

    "desc.setting": "设置：存储格式、存储路径等等",
    "desc.history": "查看、检索你已裁剪的信息",
    "desc.reset-history": "重置裁剪历史，当你在一个新设备上安装 MaoXian 时使用",
    "desc.support": "这个页面包含了 MaoXian 的运行信息、当前配置信息，这些信息有利于找出问题或者反馈bug",
    "desc.failed-tasks": "这个页面收集了所有保存失败的存储任务，你可以对这些存储任务进行重新保存",

    // remote pages
    "page.remote.home": "主页",
    "page.remote.faq": "FAQ",
    "page.remote.native-app": "本地程序",
    "page.remote.offline-page": "离线索引页",
    "page.remote.project.index": "项目首页",
    "page.remote.project.issue": "项目 issue 页面",

    "desc.remote.home": "MaoXian Web Clipper 的网站主页",
    "desc.remote.faq": "常见问题页面，当你有疑问时，可以先到这里看看，很可能已经有了对应的答案",
    "desc.remote.native-app": "一个可以增强 MaoXian 能力的本地程序",
    "desc.remote.offline-page": "一个静态的 HTML 页面, 使用这个页面，你可以脱离 MaoXian 扩展，从而离线地浏览或搜索你裁剪下来的信息",
    "desc.remote.project.index": "MaoXian 是一个开源项目，你可以在这里找到项目信息",
    "desc.remote.project.issue": "反馈建议或 bug , 请点击这个链接",
  };
  return { values: Object.assign({}, currValues, values) }
});
