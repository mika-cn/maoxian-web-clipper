(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "page-name": "重置裁剪历史",
    "init.download-folder": '加载浏览器下载目录...',
    "hint": "请从下方选择存储目录, 扩展将读取该目录并重置裁剪历史。<br /> 如果你想自动重置历史的话，请使用刷新历史功能，具体查看： <a href='go.page:extPage.setting#setting-refresh-history' target='_blank'>设置 &gt; 刷新历史</a>",
    "current-storage-path": "当前存储目录为 ：",
    "current-storage-path-value": "<code>下载目录</code> / <code>$ROOT-FOLDER</code><br />其中<code>$ROOT-FOLDER</code> 为根目录，如果该值和你要选择的目录名字不一致，请到 <a href='go.page:extPage.setting#setting-storage' target='_blank'>设置 &gt; 存储 </a>修改根目录的值，再进行重置。",
    "processing": "正在重置...",
    "completed": "重置完成, 网页关闭中...",
    "reset-clip-history-success": "裁剪历史重置成功, 共载入 $n 条记录",
    "reset-category-success": "目录重置成功, 共载入 $n 条记录",
    "reset-tag-success": "标签重置成功, 共载入 $n 条记录",
  };
  return { values: Object.assign({}, currValues, values) }
});
