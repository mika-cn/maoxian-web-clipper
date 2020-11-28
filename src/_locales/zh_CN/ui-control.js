(function (root, factory) {
  root.MxWcI18N_zh_CN = factory(root);
})(this, function(root, undefined) {
  const currValues = (root.MxWcI18N_zh_CN || {}).values || {};
  const values = {
    "switch.title": "开关 (快捷键: c)",
    "hint.selecting": "请点击或按 'Enter' 进行选中",
    "hint.selected": "按 'Enter' 确认, 方向键调整当前选中区域",
    "hint.clipping": "裁剪中...",
    "hint.clipped": "裁剪结束...",

    "hint.saving.started": "开始保存...",
    "hint.saving.progress": "保存中...($finished/$total)",
    "hint.saving.completed": "保存完成",

    //help
    "hotkey.help-message": "下方为帮助信息，点击屏幕任何地方隐藏该信息。",
    "hotkey.left.intro": "扩大选中区域",
    "hotkey.right.intro": "缩小选中区域",
    "hotkey.up.intro": "向前选中",
    "hotkey.down.intro": "向后选中",
    "hotkey.esc.intro": "返回上一步",
    "hotkey.enter.intro": "确认选中区域",
    "hotkey.delete.intro": "移除选中元素",
    "hotkey.scroll.intro": "点击选中区域使滚动到顶部/底部",
    "hotkey.adjust.intro": "切换出方向按键",
    "hotkey.back.intro": "返回上一组按钮",
    "hotkey.help.intro": "显示此帮助信息",

    // form
    "save-format": "格式",
    "title": "标题",
    "category": "目录",
    "tags": "标签",
    "hint.category": "子目录使用'/'分隔, 比如: It/js",
    "hint.tags": "多个标签用空格或逗号分隔",
  };
  return { values: Object.assign({}, currValues, values) }
});
