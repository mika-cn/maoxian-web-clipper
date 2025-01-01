import common from './common.js';

const values = {
  "switch.title": "开关 (快捷键: c)",
  "hint.selecting": "请点击或按 'Enter' 进行选中",
  "hint.selected": "按 'Enter' 确认, 方向键调整当前选中区域",
  "hint.clipping": "裁剪中...",
  "hint.clipped": "裁剪结束...",

  "hint.saving.started": "开始保存...",
  "hint.saving.progress": "保存中...(${finished}/${total})",
  "hint.saving.completed": "保存完成",

  //help
  "hotkey.help-message": "下方为帮助信息，点击屏幕任何地方隐藏该信息。",
  "hotkey.left.intro": "扩大选中区域",
  "hotkey.right.intro": "缩小选中区域",
  "hotkey.up.intro": "向上选中",
  "hotkey.down.intro": "向下选中",
  "hotkey.esc.intro": "返回上一步",
  "hotkey.enter.intro": "确认选中区域",
  "hotkey.delete.intro": "移除选中元素",
  "hotkey.scroll.intro": "点击选区滚动它到顶部/底部",
  "hotkey.adjust.intro": "切换出方向按键",
  "hotkey.back.intro": "返回上一组按钮",
  "hotkey.help.intro": "显示此帮助信息",

  // form
  "save-format": "格式",
  "title": "标题",
  "category": "分类",
  "tags": "标签",
  "hint.title": "空格弹出选择项",
  "hint.category": "空格弹出选择项，子分类使用'/'分隔, 如: It/js",
  "hint.tags": "空格弹出选择项，使用空格或逗号分隔标签",
  "hint.show-options": "弹出选择项",
};

export default Object.assign(common, values);
