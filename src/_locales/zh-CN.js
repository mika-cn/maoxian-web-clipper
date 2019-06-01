var I18N_DICT = I18N_DICT || {};

I18N_DICT['zh-CN'] = {
  "values": {
    "name": "MaoXian 网页裁剪",

    //base
    "none": "无",
    "btn.confirm": "确认",

    "op.update-success": "更新成功!",
    "op.delete-success": "删除成功!",

    //home page
    "home.nav.extension-pages": "扩展页面",
    "home.nav.remote-pages": "网站页面",
    "home.label.version": "当前版本",
    // extension pages
    "page.home": "扩展主页",
    "page.setting": "设置",
    "page.history": "历史",
    "page.reset-history": "重置历史",
    "page.support": "支持页",

    "desc.setting": "设置：存储格式、存储路径等等",
    "desc.history": "查看、检索你已裁剪的信息",
    "desc.reset-history": "重置裁剪历史，当你在一个新设备上安装 MaoXian 时使用",
    "desc.support": "这个页面包含了 MaoXian 的运行信息、当前配置信息，这些信息有利于找出问题或者反馈bug",

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


    //popup page
    "popup.menu.clip": "裁剪",
    "popup.menu.history": "历史",
    "popup.menu.setting": "设置",
    "popup.menu.home": "主页",
    "popup.menu.last-result": "查看结果",

    //welcome page
    "welcome.installation-hint": "MaoXian Web Clipper $version 已经安装成功",
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

    // errors
    "setting.error.native-app-not-ready": "你必须先安装『本地程序』并且选择『本地程序』作为保存方式，该项才生效",

    // title
    "setting.title.save-format": "保存格式",
    "setting.title.hotkey": "快捷键设置",
    "setting.title.file-url": "本地网址",
    "setting.title.clipping-content": "裁剪内容",
    "setting.title.path": "存储路径",
    "setting.title.clipping-handler": "保存方式",
    "setting.title.other": "其他设置",
    "setting.title.offline-page": "离线的索引页",
    "setting.title.refresh-history": "刷新裁剪历史",

    // buttons
    "setting.button.generate-now": "马上生成",
    "setting.button.refresh-now": "马上刷新",

    // notice
    "setting.notice.file-url.intro": "这一设置项，是用来告知浏览器扩展，你允许它访问本地网址 (file://打头的网址)",
    "setting.notice.file-url.link-label": "查看如何设置",
    "setting.notice.file-url.help-msg": "你将需要以下信息:",
    "setting.notice.file-url.ext-id": "扩展标识",
    "setting.notice.file-url-warning": "这个设置并不会改变你浏览器本身的设置，<br />请在确保你已经设置 ‘允许插件访问文件路径’ 后才勾选此项",
    "setting.notice.default-category": "<strong>默认目录</strong><br />使用 <strong>/</strong> 来分隔子目录<br />使用 <strong>$NONE</strong> 来表示空值（即无目录）",
    "setting.notice.default-clipping-folder-format": "<strong>默认裁剪文件夹格式</strong><br /><strong>$FORMAT-A</strong>: 2018-10-11-1539236251 <br /><strong>$FORMAT-B</strong>: 20181011102009 <br /><strong>$FORMAT-C</strong>: 1539236251 <br />",
    "setting.notice.title-clipping-folder-format": "<strong>标题式裁剪目录的格式</strong><br /><strong>$FORMAT-A</strong> =&gt; <code>默认裁剪文件夹</code> + <code>-</code> + <code>标题</code><br />第一部分 (<i>默认裁剪文件夹</i>) 取决于你配置的<strong>默认裁剪文件夹格式</strong><br />最后一部分 (<i>标题</i>) 则是你裁剪网页时，输入的标题.<br />例子： 2018-10-11-1539236251-我是一个酷炫的标题<br /><strong>$FORMAT-B</strong> =&gt; <code>标题</code><br />例子： 我是一个酷炫的标题<br /><strong>警告</strong>: $FORMAT-B 可能造成裁剪文件的覆盖，因为你可能会裁剪同一个网页多次而产生标题相同的问题。只有你无法忍受 $FOEMAT-A 并且你能确保自己不会遇到这种情况，才选择该格式。",
    "setting.notice.asset-path": "<strong>资源路径（图片，字体……）</strong><br />使用 <strong>$CLIP-FOLD</strong> 来表示裁剪目录（由扩展生成的目录）<br />使用 <strong>$MX-WC</strong> 来表示扩展可访问的根目录（即 $downloads/mx-wc)",
    "setting.notice.clipping-handler.intro": "<strong>浏览器下载</strong><br />使用浏览器来下载裁剪结果<br /><br /><strong>本地程序下载</strong><br />通过本地安装的程序，来下载裁剪结果（如果你安装了某个管理下载的扩展，可通过该方式，绕过扩展互相冲突的问题）<br />选择本选项需先安装一个程序",
    "setting.notice.clipping-handler.warning": "<strong> 警告! </strong><br /> 如果你选择通过本地程序来下载裁剪结果，你必须先安装本地程序，否则扩展无法正常工作",
    "setting.notice.clipping-handler.link-label": "安装地址",
    "setting.notice.offline-page": "「离线索引页面」是一个静态的  HTML 页面, 使用这个页面，你可以脱离 MaoXian 扩展，从而离线地浏览或搜索你裁剪下来的信息。",
    "setting.notice.offline-page.link-label": "点我了解更多",
    "setting.notice.autogenerate-clipping-js": "<strong>自动生成脚本文件</strong><br />勾选这个之后，每一次裁剪网页或通过历史页面删除裁剪文件，插件都会自动更新此脚本文件。此脚本文件包含了你当前所有裁剪历史，该文件会被用于上面提到的「离线索引页面」.",
    "setting.notice.clipping-js-path": "<strong>脚本文件的存储路径</strong><br />一般放到「离线索引页面」同一个目录下 <br />使用 <strong>$MX-WC</strong> 表示扩展存储数据的根目录 (即$downloads/mx-wc)",
    "setting.notice.refresh-history": "<strong>刷新裁剪历史</strong><br /> 使用『本地程序』刷新裁剪历史，当你有两个裁剪源（比如：一台电脑上的两个浏览器或两台电脑上的浏览器）并且想让浏览器上的裁剪历史保持最新的时候，这一项非常有用。",
    "setting.notice.refresh-history-warning": "<strong>警告</strong>:<br /> 你必须先安装『本地程序』并且选择『本地程序』作为保存方式，该项才生效",

    // label
    "setting.file-url-input.label": "我设置好了 ‘允许插件访问文件路径’",
    "setting.clip-information-input.label": "裁剪文件包含裁剪信息 (原网址、时间、目录和标签)",
    "setting.save-web-font-input.label": "保存Web字体(建议取消勾选)",
    "setting.save-css-image-input.label": "存储 CSS 背景图(建议取消勾选)",
    "setting.save-domain-tag-input.label": "裁剪时，添加当前域名为标签",
    "setting.save-title-as-fold-name-input.label": "使用标题作为文件夹的名字（默认为扩展自动生成）",
    "setting.save-title-as-filename-input.label": "使用标题作为文件名（默认为 index.html 或 index.md ）",
    "setting.enable-switch-hotkey-input.label": "启用快捷键 `c` (裁剪开关)",
    "setting.enable-mouse-mode-input.label": "鼠标友好模式",
    "setting.autogenerate-clipping-js-input.label": "自动生成脚本文件",
    "setting.not-generated-yet.label": "还没有生成过",
    "setting.generate-now-msg-sent.label": "生成命令已经发送",
    "setting.generate-now-success.label": "生成成功",
    "setting.last-generate-time.label": "上次生成时间",
    "setting.auto-refresh-history-input.label": "自动刷新裁剪历史(每次你打开浏览器都会进行刷新)",
    "setting.refresh-now-msg-sent.label": "刷新命令已发送",
    "setting.refresh-now-success.label": "刷新成功",
    "setting.last-refresh-time.label": "上次刷新时间",

    // placeholder
    "setting.placeholder.notblank": "此项不能为空",

    // options
    "setting.clipping-handler-option.browser": "浏览器下载",
    "setting.clipping-handler-option.native-app": "本地程序下载",

    //history page
    "history.placeholder.search": "可搜索标题、标签、目录、源网址",
    "history.placeholder.created-at-from": "起始日期",
    "history.placeholder.created-at-to": "结束日期",
    "history.placeholder.category": "目录",
    "history.placeholder.tag": "标签",
    "history.btn.search": "搜索",
    "history.btn.reset": "重置",
    "history.btn.clear-history": "清除历史",
    "history.btn.export-history": "导出历史",
    "history.a.reset_history": "重置历史",
    "history.th.title": "标题",
    "history.th.path": "路径",
    "history.th.original-url": "裁自",
    "history.th.time": "时间",
    "history.th.category": "目录",
    "history.th.tag": "标签",
    "history.th.format": "格式",
    "history.no_record": "找不到记录",
    "history.export.no-record": "没有记录",
    "history.op.delete": "删除",
    "history.label.confirm-mode": "危险操作需确认",
    "history.label.advanced-search-mode": "高级搜索",
    "history.confirm-msg.clear-history": "确认清除所有历史记录？（该操作不会删除对应的文件）",
    "history.confirm-msg.delete-history": "确认删除这条历史记录? （该操作不会删除对应的文件）",
    "history.confirm-msg.delete-history-and-file": "确认删除这条历史记录，以及对应的文件？",

    "clipping.op-error.path-overflow": "要删除的文件不在裁剪目录下，请检查你本地程序的配置文件(config.yaml) ",
    "clipping.op-error.path-not-exist": "找不到要删除的文件",
    "clipping.op-warning.asset-fold-overflow": "你当前配置的资源目录不在裁剪目录下，这会造成某些资源文件删除不干净的问题，请检查你本地程序的配置文件(config.yaml) ",
    "history.notice.delete-history-success": "删除成功!",
    "history.notice.clear-history-success": "清除成功!",
    "history.notice.delete": "温馨提示： 只有安装了「本地程序」，本页面提供的删除功能才会删除你本地的文件。",

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
    "hint.selected": "按'Enter' 确认, 方向键调整当前选中区域",
    "hint.clipping": "裁剪中...",

    "hint.saving.started": "开始保存...",
    "hint.saving.progress": "保存中...($finished/$total)",
    "hint.saving.completed": "保存完成",

    //help
    "hotkey.left.intro": "扩大选中区域",
    "hotkey.right.intro": "缩小选中区域",
    "hotkey.up.intro": "向前选中",
    "hotkey.down.intro": "向后选中",
    "hotkey.esc.intro": "返回自由模式",
    "hotkey.enter.intro": "确认选中区域",
    "hotkey.delete.intro": "移除选中元素",
    "hotkey.scroll.intro": "滚动到选中区域的顶部/底部",
    "hotkey.scroll.name": "点击",

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

    //notifications
    "notification.title": "消息中心",
    "notification.hint": "删除消息，请直接点击消息",
    "notification.native-app-version-too-small": "Native Application(本地程序) 版本必须 >= $requiredVersion, 但是当前安装的程序版本为 $currentVersion， 请更新你的本地程序",
    "notification.native-app-connect-failed": "你设置了使用本地程序来下载裁剪结果，但是你当前的本地程序安装不成功或工作不正常 (错误信息: $errorMessage)"

  }
};
