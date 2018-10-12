var I18N_DICT = I18N_DICT || {};

I18N_DICT['zh-CN'] = {
  "values": {
    "name": "MaoXian 网页裁剪",

    //base
    "none": "无",
    "btn.confirm": "确认",

    //popup page
    "popup.menu.clip": "裁剪",
    "popup.menu.history": "历史",
    "popup.menu.setting": "设置",
    "popup.menu.home": "主页",
    "popup.menu.last-result": "查看结果",

    //welcome page
    "welcome.installation-hint": "MaoXian Web Clipper 已经安装成功",
    "welcome.sayhi": "欢迎!",
    "welcome.extra-intro": "在你开始裁剪之前，请把下面这两个额外步骤走完，以便拥有最佳体验",
    "welcome.extra-1-chrome": "1. 关闭谷歌的 ‘每次下载都询问保存位置’ 这个选项<br />这个可以通过取消复选框 <strong><a href='' link='chrome://settings/downloads' class='tab-link'>chrome://settings</a></strong> &gt; <i>下载</i> &gt; <i>每次下载都询问保存位置</i>",
    "welcome.extra-1-firefox": "1. 关闭火狐的 ‘每次下载都询问保存位置’ 这个选项<br /> 从浏览器地址栏输入 <strong>about:preferences</strong> &gt; 回车 &gt; <i>下载</i> &gt; <i>取消选中「每次下载都询问保存位置」</i>",
    "welcome.extra-2-chrome": "2. 允许 MaoXian 访问本地网址来获得更好的预览体验, 勾选复选框<i>「允许扩展访问本地文件」</i> 通过 <strong>$extensionLink</strong>.",
    "welcome.extra-2-firefox": "2. 允许 MaoXian 访问本地网址来获得更好的预览体验, 详见 <strong>$allowFileUrlAccessLink</strong>",
    "welcome.notice": "<strong class='green'>注意:</strong> 如果你要裁剪的页面是在安装本扩展之前打开的，请先刷新那个页面",
    "welcome.last-hint": '如果你还有其他的问题，请访问我们的 $faqLink 页面</p>',

    //setting page
    "setting.warning": "警告",

    // title
    "setting.title.save-format": "保存格式",
    "setting.title.hotkey": "快捷键设置",
    "setting.title.file-url": "本地网址",
    "setting.title.clipping-content": "裁剪内容",
    "setting.title.path": "存储路径",
    "setting.title.clipping-handler": "保存方式",

    // notice
    "setting.notice.file-url.intro": "这一设置项，是用来告知浏览器扩展，你允许它访问本地网址 (file://打头的网址)",
    "setting.notice.file-url.link-label": "查看如何设置",
    "setting.notice.file-url.help-msg": "你将需要以下信息:",
    "setting.notice.file-url.ext-id": "扩展标识",
    "setting.notice.file-url-warning": "这个设置并不会改变你浏览器本身的设置，<br />请在确保你已经设置 ‘允许插件访问文件路径’ 后才勾选此项",
    "setting.notice.default-category": "<strong>默认目录</strong><br />使用 <strong>/</strong> 来分隔子目录<br />使用 <strong>$NONE</strong> 来表示空值（即无目录）",
    "setting.notice.default-clipping-folder-format": "<strong>默认裁剪文件夹格式</strong><br /><strong>$FORMAT-A</strong>: 2018-10-11-1539236251 <br /><strong>$FORMAT-B</strong>: 20181011102009 <br />",
    "setting.notice.asset-path": "<strong>资源路径（图片，字体……）</strong><br />使用 <strong>$CLIP-FOLD</strong> 来表示裁剪目录（由扩展生成的目录）<br />使用 <strong>$MX-WC</strong> 来表示扩展可访问的根目录（即 $downloads/mx-wc)",
    "setting.notice.clipping-handler.intro": "<strong>浏览器下载</strong><br />使用浏览器来下载裁剪结果<br /><br /><strong>本地程序下载</strong><br />通过本地安装的程序，来下载裁剪结果（如果你安装了某个管理下载的扩展，可通过该方式，绕过插件互相冲突的问题）<br />选择本选项需先安装一个程序",
    "setting.notice.clipping-handler.link-label": "安装地址",

    // label
    "setting.file-url-input.label": "我设置好了 ‘允许插件访问文件路径’",
    "setting.clip-information-input.label": "裁剪文件包含裁剪信息 (原网址、时间、目录和标签)",
    "setting.save-domain-tag-input.label": "裁剪时，添加当前域名为标签",
    "setting.save-title-as-fold-name-input.label": "使用标题作为文件夹的名字（默认为扩展自动生成）",
    "setting.save-title-as-filename-input.label": "使用标题作为文件名（默认为 index.html 或 index.md ）",
    "setting.enable-switch-hotkey-input.label": "启用快捷键 `c` (裁剪开关)",

    // placeholder
    "setting.placeholder.notblank": "此项不能为空",

    // options
    "setting.clipping-handler-option.browser": "浏览器下载",
    "setting.clipping-handler-option.native-app": "本地程序下载",

    //history page
    "history.input.placeholder": "可搜索标题、标签、目录",
    "history.btn.search": "搜索",
    "history.a.reset_history": "重置历史",
    "history.th.title": "标题",
    "history.th.path": "路径",
    "history.th.time": "时间",
    "history.th.category": "目录",
    "history.th.tag": "标签",
    "history.th.format": "格式",
    "history.no_record": "找不到记录",

    //reset history page
    "init.downloadFold": '加载浏览器下载目录...',
    "reset.hint": '请从下方选择裁剪目录("$下载目录/mx-wc"), 插件读取该目录并重置裁剪历史。',
    "reset.processing": "正在重置...",
    "reset.completed": "重置完成, 网页关闭中...",
    "reset.clip_history_success": "裁剪历史重置成功, 共载入 $n 条记录",
    "reset.category_success": "目录重置成功, 共载入 $n 条记录",
    "reset.tag_success": "标签重置成功, 共载入 $n 条记录",

    // entry(btn & hint)
    "switch.title": "开关 (快捷键: c)",
    "hint.selecting": "移动光标, 点击选中",
    "hint.selected": "按'Enter' 确认, 方向键调整",
    "hint.downloading": "下载中...",

    //help
    "hotkey.left.intro": "扩大选中区域",
    "hotkey.right.intro": "缩小选中区域",
    "hotkey.up.intro": "向前选中",
    "hotkey.down.intro": "向后选中",
    "hotkey.esc.intro": "返回自由模式",
    "click.scroll.intro": "滚动到选中区域的顶部/底部",
    "click": "点击",

    // form
    "title": "标题",
    "category": "目录",
    "tags": "标签",
    "hint.category": "子目录使用'/'分隔, 比如: It/js",
    "hint.tags": "多个标签用空格或逗号分隔",
    "save": "保存",
    "cancel": "取消",

    //output
    "original_url": "原网址",
    "access": "访问",
    "created_at": "创建于",

  }
};
