(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "installation-hint": "MaoXian Web Clipper $version 已经安装成功",
    "sayhi": "欢迎!",
    "extra-intro": "在你开始裁剪之前，请把下面这两个额外步骤走完，以便拥有最佳体验",
    "extra-1-chrome": "1. 关闭谷歌的 ‘每次下载都询问保存位置’ 这个选项<br />这个可以通过取消复选框 <strong><a href='' link='chrome://settings/downloads' class='tab-link'>chrome://settings</a></strong> &gt; <i>下载</i> &gt; <i>每次下载都询问保存位置</i>",
    "extra-1-firefox": "1. 关闭火狐的 ‘每次下载都询问保存位置’ 这个选项<br /> 从浏览器地址栏输入 <strong>about:preferences</strong> &gt; 回车 &gt; <i>下载</i> &gt; <i>取消选中「每次下载都询问保存位置」</i>",
    "extra-2-chrome": "2. 允许 MaoXian 访问本地网址来获得更好的预览体验, 勾选复选框<i>「允许扩展访问本地文件」</i> 通过 <strong>$extensionLink</strong>.",
    "extra-2-firefox": "2. 允许 MaoXian 访问本地网址来获得更好的预览体验, 详见 <strong><a href='go.page:faq-allow-access-file-urls' target='_blank'>允许访问本地网址</a></strong>",
    "notice": "<strong class='green'>注意:</strong> 如果你要裁剪的页面是在安装本扩展之前打开的，请先刷新那个页面",
    "last-hint": "如果你还有其他的问题，请访问我们的 <a href='go.page:faq' target='_blank'>FAQ</a> 页面</p>",
  };
  return { values: Object.assign({}, currValues, values) }
});
