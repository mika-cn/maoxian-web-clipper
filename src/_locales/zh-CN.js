  "use strict";

  const LocaleZhCN = {
  "values": {
    "name": "MaoXian 网页裁剪",

    //=====================================
    // global
    //=====================================
    "none": "无",
    "no.record": "无信息",
    "btn.confirm": "确认",

    "op.saved": "已保存",
    "op.update-success": "更新成功!",
    "op.delete-success": "删除成功!",

    // options
    "option.save-format.html.name": "HTML",
    "option.save-format.md.name": "Markdown",

    // errors
    "error.not-a-number": "输入值不是数字",
    "error.not-in-allowed-range": "输入值不在允许范围之内",


    //=====================================
    // home page
    //=====================================
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


    //=====================================
    // popup page
    //=====================================
    "popup.menu.clip": "裁剪",
    "popup.menu.history": "历史",
    "popup.menu.setting": "设置",
    "popup.menu.home": "主页",
    "popup.menu.last-result": "查看结果",
    "popup.menu.debug": "调试",

    //=====================================
    // welcome page
    //=====================================
    "welcome.installation-hint": "MaoXian Web Clipper $version 已经成功安装",
    "welcome.sayhi": "欢迎！",
    "welcome.extra-intro": "在你开始裁剪之前，请把下面这两个额外步骤走完，以便拥有最佳体验",
    "welcome.extra-1-chrome": "1. 关闭谷歌的 ‘每次下载都询问保存位置’ 这个选项<br />这个可以通过取消复选框 <a href='' link='chrome://settings/downloads' class='tab-link'>chrome://settings</a>< &gt; <i>下载</i> &gt; <i>每次下载都询问保存位置</i>",
    "welcome.extra-1-firefox": "1. 关闭火狐的 ‘每次下载都询问保存位置’ 这个选项<br /> 从浏览器地址栏输入 about:preferences< &gt; 回车 &gt; <i>下载</i> &gt; <i>取消选中「每次下载都询问保存位置」</i>",
    "welcome.extra-2-chrome": "2. 允许 MaoXian 访问本地网址来获得更好的预览体验, 勾选复选框<i>「允许扩展访问本地文件」</i> 通过 $extensionLink<.",
    "welcome.extra-2-firefox": "2. 允许 MaoXian 访问本地网址来获得更好的预览体验, 详见 <a href='go.page:faq-allow-access-file-urls' target='_blank'>允许访问本地网址</a><",
    "welcome.notice": "<strong class='green'>注意：</strong> 如果你要裁剪的页面是在安装本扩展之前打开的，请先刷新那个页面",
    "welcome.last-hint": "如果你还有其他的问题，请访问我们的 <a href='go.page:faq' target='_blank'>FAQ</a> 页面</p>",

    //=====================================
    // setting page
    //=====================================
    "setting.warning": "警告",
    "setting.version": "当前版本：",
    "setting.ruby-version": "Ruby 版本：",

    // errors
    "error.handler.not-enabled": "处理程序未启用",
    "error.handler.not-ready": "处理程序处于不可用状态",
    "error.value-invalid": "输入值无效",


    // title
    "setting.title.intro": "简介",
    "setting.title.feature": "功能",
    "setting.title.status": "当前状态",
    "setting.title.detail": "详情",

    "setting.title.general": "基础设置",
    "setting.title.storage": "存储设置",
    "setting.title.assistant": "助手设置",
    "setting.title.public-plan": "公开的「计划」",
    "setting.title.subscriptions": "我的订阅（已下载）",
    "setting.title.subscription.name": "名称",
    "setting.title.subscription.version": "版本",
    "setting.title.subscription.size": "记录数",
    "setting.title.subscription.plans": "查看计划",
    "setting.title.subscription.url": "网址",
    "setting.title.subscription.detail": "细节",
    "setting.title.custom-plan": "自定义「计划」",
    "setting.title.handler": "处理程序",
    "setting.title.handler-browser": "浏览器",
    "setting.title.handler-native-app": "本地程序",
    "setting.title.handler-wiz-note-plus" :"为知笔记",

    "setting.title.save-format": "保存格式",
    "setting.title.control": "操作设置",
    "setting.title.file-url": "本地网址",
    "setting.title.advanced": "高级",
    "setting.title.request": "HTTP 请求",
    "setting.title.request-timeout": "超时设置",
    "setting.title.request-referrer-policy": "設置 Referrer",
    "setting.title.misc": "杂项",
    "setting.title.clipping-content": "裁剪内容",
    "setting.title.html-content": "HTML",
    "setting.title.markdown-content": "Markdown",
    "setting.title.offline-page": "离线索引页面",
    "setting.title.refresh-history": "刷新裁剪历史",

    "setting.title.root-folder": "根目录",
    "setting.title.default-category": "默认分类",
    "setting.title.clipping-folder-name": "裁剪目录",
    "setting.title.main-file": "主文件",
    "setting.title.asset-file": "资源文件",
    "setting.title.frame-file": "内嵌的网页文件",
    "setting.title.info-file": "元信息文件",
    "setting.title.title-file": "标题文件",

    "setting.title.path": "存储路径",
    "setting.path-intro.format": "格式：",
    "setting.path.download": "下载路径",
    "setting.path.filename": "主文件名",
    "setting.folder.root": "根目录",
    "setting.folder.category": "分类目录",
    "setting.folder.clipping": "裁剪目录",

    "setting.help.label": "点击显示（或隐藏）帮助信息",
    "setting.help.avariable-variable": "可用变量",
    // variables
    "setting.variable-in-folder": "以下变量可用于存储目录",
    "setting.variable-in-filename": "以下变量可用于文件名",
    "setting.variable.storage-path": '$STORAGE-PATH 等同于： <code>下载路径</code> / <code>根目录</code>',
    "setting.variable.category-path": '$CATEGORY-PATH 等同于： <code>下载路径</code> / <code>根目录</code> / <code>分类目录</code>',
    "setting.variable.clipping-path": '$CLIPPING-PATH 等同于： <code>下载路径</code> / <code>根目录</code> / <code>分类目录</code> / <code> 裁剪目录</code>',


    "setting.variable.none": "<pre>$NONE   => 表示空值 （即无目录）</pre>",
    "setting.variable.title": "<pre>$TITLE  => 网页标题 </pre>",
    "setting.variable.domain": "<pre>$DOMAIN => 当前网站的域名 （例： blog.example.org） </pre>",
    "setting.variable.format": "<pre>$FORMAT => 'html' 或者 'md' （取决于保存格式） </pre>",

    "setting.variable.year"                : "<pre>$YYYY   => 年 （4 位数字, 例： 2018）</pre>",
    "setting.variable.short-year"          : "<pre>$YY     => 年 （2 位数字, 例： 18）</pre>",
    "setting.variable.month"               : "<pre>$MM     => 月 （2 位数字, 01 ~ 12）</pre>",
    "setting.variable.day"                 : "<pre>$DD     => 日 （2 位数字, 01 ~ 31）</pre>",
    "setting.variable.hour"                : "<pre>$HH     => 时 （2 位数字, 00 ~ 23）</pre>",
    "setting.variable.minute"              : "<pre>$mm     => 分 （2 位数字, 00 ~ 59）</pre>",
    "setting.variable.second"              : "<pre>$SS     => 秒 （2 位数字, 00 ~ 59）</pre>",
    "setting.variable.time-integer-second" : "<pre>$TIME-INTSEC => 以秒表示的裁剪时间（例：1578712781）.</pre>",


    "setting.path.download.intro": "下载路径： 该路径即是你浏览器设置的下载目录，如果你使用「本地程序」的话，该路径是你配置文件（config.yaml）里面的 data_dir 项所配置的目录。",
    "setting.path.filename.intro": "主文件名： 即保存下来的主文件的名字，默认为 <code>index.html</code> 或 <code>index.md</code>",
    "setting.folder.root.intro": "根目录： 该目录为扩展的存储入口，所有裁剪下来的文件都会存储在该目录下。",
    "setting.folder.category.intro": "分类目录： 该目录是用于归类的，可由多级组成，其值由表单的输入决定，例如表单的输入项为 <code>新闻/体育</code> 那么会生成 <code>新闻</code> 这个目录，同时在新闻目录下生成 <code>体育</code> 这个子目录。",
    "setting.folder.clipping.intro": "裁剪目录： 扩展可以为每次裁剪都生成一个裁剪目录，并把裁剪下来的文件保存在该目录下",

    // handler
    "handler.browser.name": "浏览器",
    "handler.browser.intro": "浏览器是默认的处理程序。是你安装完扩展后，唯一一个不用额外对接就可使用的处理程序",
    "handler.browser.feature.a": "下载裁剪结果到本地硬盘",
    "handler.browser.feature.b": "同步「离线索引页面」的裁剪记录",

    "handler.native-app.name": "本地程序",
    "handler.native-app.intro": "这是一个很小的本地程序，我们开发这个程序来增强 Maoxian 的能力。",
    "handler.native-app.feature.a": "保存裁剪结果（用于绕过浏览器的下载功能，从而避免与下载管理扩展发生冲突）, 其存储位置也为本地硬盘",
    "handler.native-app.feature.b": "删除裁剪信息（让我们可以删除裁剪历史的同时，删除其对应的文件）",
    "handler.native-app.feature.c": "刷新裁剪历史（当你有两个裁剪源（比如：一台电脑上的两个浏览器或两台电脑上的浏览器）并且想让浏览器上的裁剪历史保持最新的时候，这一项非常有用。）",
    "handler.native-app.warning": "<strong> 警告! </strong><br /> 如果你启用「本地程序」, 你必须先 <a href='go.page:native-app' target='_blank'>安装它</a>，否则该处理程序无法正常工作",
    "handler.native-app.error.version": "当前扩展依赖的「本地程序」的版本必须大于或等于 $requiredVersion, 但是当前安装的版本为 $currentVersion，请<a href='go-page:native-app#upgrade' target='_blank'>更新你的本地程序</a>",
    "handler.native-app.error.install": "可能是由于你的「本地程序」还没有安装或者安装未成功导致的（<a href='go.page:native-app' target='_blank'>查看如何安装</a>）",

    "handler.wiz-note-plus.name": "为知笔记",
    "handler.wiz-note-plus.intro": "为知笔记一个款跨平台云笔记客户端",
    "handler.wiz-note-plus.feature.a": "将网页剪裁保存到为知笔记数据库",
    "handler.wiz-note-plus.warning": "<strong> 警告！ </strong><br /> 如果你启用为知笔记，你必须先 <a href='https://github.com/altairwei/WizNotePlus/releases' target='_blank'>安装它</a>，并且剪裁时为知笔记必须处于启动状态，否则处理程序无法正常工作",


    "setting.option.request-referrer-policy.origin-when-cross-origin": "同域请求时，Referrer 为全路径（请求域 + 请求路径），跨域请求时，Referrer 只包含请求域（协议 + 域名 + 端口）",
    "setting.option.request-referrer-policy.origin": "Referrer 只包含请求域（协议 + 域名 + 端口）",
    "setting.option.request-referrer-policy.no-referrer": "不发送 Referer",
    "setting.option.request-referrer-policy.unsafe-url": "Referrer 为全路径（请求域 + 请求路径）",


    "setting.notice.info.storage.browser": "使用浏览器来下载裁剪结果",
    "setting.notice.info.storage.native-app": "通过本地安装的程序，来下载裁剪结果（如果你安装了某个管理下载的扩展，可通过该方式，绕过扩展互相冲突的问题）<br /><a href='go.page:native-app' target='_blank'>选择本选项需先安装「本地程序」</a>",
    "setting.notice.info.storage.wiz-note-plus": "使用为知笔记保存剪裁结果<br />",

    "setting.notice.info.offline-page.browser": "$BLANK",
    "setting.notice.info.offline-page.native-app": "$BLANK",
    "setting.notice.info.refresh-history.native-app": "$BLANK",

    "setting.notice.warning.storage.browser": "$BLANK",
    "setting.notice.warning.storage.native-app": "$BLANK",
    "setting.notice.warning.storage.wiz-note-plus": "$BLANK",
    "setting.notice.warning.offline-page.browser": "$BLANK",
    "setting.notice.warning.offline-page.native-app": "$BLANK",
    "setting.notice.warning.refresh-history.native-app": "$BLANK",

    "setting.notice.danger.native-app-not-ready": "「本地程序」当前不可用 <br />错误信息： $MESSAGE",

    "setting.notice.danger.wiz-note-plus-ready": "成功连接为知笔记。",
    "setting.notice.danger.wiz-note-plus-not-ready": "为知笔记当前不可用，错误日志：$MESSAGE <br /> 很可能「为知笔记」没有启动。如果你尚未安装，请查看 <a href='https://github.com/altairwei/WizNotePlus/releases' target='_blank'>安装页面<a/>",

    // buttons
    "setting.button.generate-now": "马上生成",
    "setting.button.refresh-now": "马上刷新",
    "setting.button.update-now": "马上更新",
    "setting.button.save": "保存",

    // notice
    "setting.notice.main-file-intro": "主文件是你裁剪下来的 HTML 文件（即网页文件）或者是 Markdown 文件（取决于保存格式是什么）",
    "setting.notice.asset-file-intro": "资源文件指的是跟随网页的图片，样式，字体和网站图标（注：不包含脚本文件，居于安全考虑，MaoXian 不保存脚本文件）。",
    "setting.notice.frame-file-intro": "顾名思义，这些网页内嵌在主网页中。在裁剪的过程中，如果保存格式为 HTML，则会把这些内嵌的网页另存为一个文件，并在主文件中引入；如果保存格式为 Markdown，则会把这些内嵌的网页的内容嵌入到主文件中。",
    "setting.notice.info-file-intro": "元信息文件是用来记录整个裁剪过程所涉及的信息的，内容包括保存格式，裁剪时间，原网址，分类，标签等等。",
    "setting.notice.title-file-intro": "标题文件是一个包含空内容的文件，其特点是文件名包含标题，如果你的主文件的路径不包含标题信息，则可以在主文件的同级目录中保存该文件，以便浏览，该文件为可选。",

    "setting.notice.file-url.intro": "这一设置项，是用来告知浏览器扩展，你允许它访问本地网址 (file://打头的网址)",
    "setting.notice.file-url.link-label": "查看如何设置",
    "setting.notice.file-url.help-msg": "你将需要以下信息:",
    "setting.notice.file-url.ext-id": "扩展标识",
    "setting.notice.file-url-warning": "这个设置并不会改变你浏览器本身的设置，<br />请在确保你已经设置 ‘允许插件访问文件路径’ 后才勾选此项",
    "setting.notice.front-matter": "YAML Front Matter 是一段位于 Markdown 文件开头的 YAML 文本，常用于保存文档本身的元信息，你可以使用它来保存裁剪信息。",
    "setting.notice.front-matter-template": "使用下方的模板，配置你想记录的信息。<br />可使用的变量为：<code>title, url, category, tags, createdAt, sYear, month, day, hour, minute, second, intSec</code>。",
    "setting.notice.root-folder": "<strong>注意：</strong><br />该项作为存储入口，最好一但设定好就不要变更它，如果你修改了这个值，文件系统里对应的文件夹名字也需要做对应的修改，以避免产生一旧一新两个存储入口。",
    "setting.notice.clipping-folder-name": "MaoXian 可以为每次裁剪都创建一个目录，以用于存储裁剪结果，我们把这个目录叫做裁剪目录。",
    "setting.notice.default-category": "默认分类指的是你在裁剪过程中，没有输入分类的情况下使用的值<br />使用 <strong>/</strong> 来分隔子文件夹<br />",
    "setting.notice.clipping-handler.link-label": "安装地址",
    "setting.notice.offline-page": "「离线索引页面」是一个静态的  HTML 页面, 使用这个页面，你可以脱离 MaoXian 扩展，从而离线地浏览或搜索你裁剪下来的信息。",
    "setting.notice.offline-page.link-label": "点我了解更多",
    "setting.notice.autogenerate-clipping-js": "<strong>自动生成脚本文件</strong><br />勾选这个之后，每一次裁剪网页或通过历史页面删除裁剪文件，插件都会自动更新此脚本文件。此脚本文件包含了你当前所有裁剪历史，该文件会被用于上面提到的「离线索引页面」.",
    "setting.notice.clipping-js-path": "<strong>脚本文件的存储路径</strong><br />一般放到「离线索引页面」同一个目录下 <br />使用 <strong>$STORAGE-PATH</strong> 来表示： <code>下载路径</code> / <code>根目录</code>",
    "setting.notice.refresh-history": "当你有两个裁剪源（比如：一台电脑上的两个浏览器或两台电脑上的浏览器）并且想让浏览器上的裁剪历史保持最新的时候，这一项非常有用。",
    "setting.notice.assistant-intro": "使用「毛线助手」，我们可以对于某个网站的网页，预先定义一个「计划」，该计划包含一系列「动作」。当你对这个网站的网页进行裁剪时，该计划就会运用到网页上面。目前支持的「动作」包括： 选中元素、隐藏元素、显示元素以及修改元素的属性。",
    "setting.notice.public-plan-intro": "「公开的计划列表」是由 众多 MaoXian 用户分享而来的。你可以通过订阅这些列表来获取大家分享的「计划」。",
    "setting.notice.edit-subscription": "通过下方文本框编辑订阅信息，你可以使用「换行符」分隔多个订阅网址，任何使用 <code>#</code>开头的行将被视为注释。<br /><br /><strong>注意：</strong><br /> 1. 扩展提供的默认订阅网址，是没有拉取订阅信息的。如果你是第一次使用该功能，请点击「更新按钮」进行拉取。<br />2. 点击「保存按钮」并不会拉取订阅信息。你应该在保存成功后，通过点击「更新按钮」或者勾选「自动更新复选框」来拉取订阅信息。<br /><br /><a href='go.page:public-subscriptions' target='_blank'>查看可订阅列表</a>",
    "setting.notice.custom-plan-intro": '由你编写的「计划」（ <a href="go.page:how-to-write-a-plan" target="_blank">了解如何编写「计划」</a>），自定义「计划」比公开的「计划」拥有更高的优先级',

    // label
    "setting.storage-folder.label": "存储目录",
    "setting.storage-filename.label": "文件名",
    "setting.save-title-file-input.label": "保存标题文件",

    "setting.enable-handler.label": "启用该处理程序",
    "setting.file-url-input.label": "我设置好了 ‘允许插件访问文件路径’",
    "setting.request-timeout-input.label": "请求的超时时长 (秒, 5~240)",
    "setting.clip-information-input.label": "裁剪文件包含裁剪信息 (原网址、时间、目录和标签)",
    "setting.md-front-matter-enabled-input.label": "启用 YAML Front Matter",
    "setting.save-icon-input.label": "保存网站图标",
    "setting.save-web-font-input.label": "保存Web字体(建议取消勾选)",
    "setting.save-css-image-input.label": "存储 CSS 背景图(建议取消勾选)",
    "setting.save-domain-tag-input.label": "裁剪时，添加当前域名为标签",
    "setting.hotkey-switch-enabled-input.label": "启用快捷键 `c` (裁剪开关)",
    "setting.mouse-mode-enabled-input.label": "鼠标友好模式",
    "setting.input-field-save-format-enabled.label": "启用表单上的格式选择",
    "setting.remember-selection-input.label": "记住选区，并在下次尝试自动选中",
    "setting.autogenerate-clipping-js-input.label": "自动生成脚本文件",
    "setting.not-generated-yet.label": "还没有生成过",
    "setting.generate-now-msg-sent.label": "生成命令已经发送",
    "setting.generate-now-success.label": "生成成功",
    "setting.last-generate-time.label": "上次生成时间",
    "setting.auto-refresh-history-input.label": "自动刷新裁剪历史(每次你打开浏览器都会进行刷新)",
    "setting.refresh-now-msg-sent.label": "刷新命令已发送",
    "setting.refresh-now-success.label": "刷新成功",
    "setting.last-refresh-time.label": "上次刷新时间",
    "setting.communicate-with-third-party-input.label": "开启第三方消息",
    "setting.assistant-enabled-input.label": "启用助手",
    "setting.auto-update-public-plan-input.label": "自动更新 (每次你打开浏览器都会尝试进行更新)",
    "setting.last-update-time.label": "上次更新时间",
    "setting.update-now-success.label": "更新成功",

    // placeholder
    "setting.placeholder.notblank": "此项不能为空",

    //=====================================
    // history page
    //=====================================
    "history.placeholder.search": "可搜索标题、标签、目录、源网址",
    "history.placeholder.created-at-from": "起始日期",
    "history.placeholder.created-at-to": "结束日期",
    "history.placeholder.category": "目录",
    "history.placeholder.tag": "标签",
    "history.btn.search": "搜索",
    "history.btn.reset": "重置",
    "history.btn.clear-history": "清除历史",
    "history.btn.export-history": "导出历史",
    "history.a.reset-history": "重置历史",
    "history.th.title": "标题",
    "history.th.path": "路径",
    "history.th.original-url": "裁自",
    "history.th.time": "时间",
    "history.th.category": "目录",
    "history.th.tag": "标签",
    "history.th.format": "格式",
    "history.no-record": "找不到记录",
    "history.export.no-record": "没有记录",
    "history.op.delete": "删除",
    "history.label.confirm-mode": "危险操作需确认",
    "history.label.advanced-search-mode": "高级搜索",
    "history.confirm-msg.clear-history": "确认清除所有历史记录？（该操作不会删除对应的文件）",
    "history.confirm-msg.delete-history": "确认删除这条历史记录? （该操作不会删除对应的文件）",
    "history.confirm-msg.delete-history-and-file": "确认删除这条历史记录，以及对应的文件？",

    "clipping.op-error.path-overflow": "要删除的文件不在裁剪目录下，请检查你本地程序的配置文件(config.yaml) ",
    "clipping.op-error.path-not-exist": "找不到要删除的文件",
    "clipping.op-error.json-parse-error": "JSON 解析失败",
    "clipping.op-warning.asset-folder-overflow": "你当前配置的资源目录不在裁剪目录下，这会造成某些资源文件删除不干净的问题，请检查你本地程序的配置文件(config.yaml) ",
    "history.notice.delete-history-success": "删除成功!",
    "history.notice.clear-history-success": "清除成功!",
    "history.notice.delete": "温馨提示： 只有安装了「本地程序」，本页面提供的删除功能才会删除你本地的文件。",
    "history.error.native-app-version-too-small": "「本地程序」的当前版本（$VERSION） 无法处理该消息, 请升级「本地程序」.",


    //=====================================
    // reset history page
    //=====================================
    "reset.page-name": "重置裁剪历史",
    "init.download-folder": '加载浏览器下载目录...',
    "reset.hint": "请从下方选择存储目录, 扩展将读取该目录并重置裁剪历史。<br /> 如果你想自动重置历史的话，请使用刷新历史功能，具体查看： <a href='go.page:extPage.setting#setting-refresh-history' target='_blank'>设置 &gt; 刷新历史</a>",
    "reset.current-storage-path": "当前存储目录为 ：",
    "reset.current-storage-path-value": "<code>下载目录</code> / <code>$ROOT-FOLDER</code><br />其中 <code>$ROOT-FOLDER</code> 为根目录，如果该值和你要选择的目录名字不一致，请到 <a href='go.page:extPage.setting#setting-storage' target='_blank'>设置 &gt; 存储</a> 修改根目录的值，再进行重置。",
    "reset.processing": "正在重置...",
    "reset.completed": "重置完成, 网页关闭中...",
    "reset.clip-history-success": "裁剪历史重置成功, 共载入 $n 条记录",
    "reset.category-success": "目录重置成功, 共载入 $n 条记录",
    "reset.tag-success": "标签重置成功, 共载入 $n 条记录",

    //=====================================
    // last clipping result page (lcr)
    //=====================================
    "lcr.label.original-url": "网页网址",
    "lcr.label.file": "文件：",
    "lcr.label.err-msg": "错误信息：",
    "lcr.notice.not-clipping-result": "无内容可查看",
    "lcr.notice.openable-url": "你可点击下方链接查看该裁剪结果.",
    "lcr.notice.can-not-open-file-url": "你无法直接打开该链接. 因为扩展不被允许打开该类型的链接, 查看 <strong>设置页 > 本地网址</strong> 获取关于此的更多信息",
    "lcr.message.failed-task-num": "本次裁剪过程中，有 $num 个资源保存失败.",

    //=====================================
    // entry(btn & hint)
    //=====================================
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
    "save": "保存",
    "cancel": "取消",

    //=====================================
    // output
    //=====================================
    "original-url": "原网址",
    "access": "访问",
    "created-at": "创建于",

    //=====================================
    // plan subscription page
    //=====================================
    "plan-subscription.page-title": "订阅详情",
    "plan-subscription.title.subscription": "基本信息",
    "plan-subscription.title.plans": "计划",

  }};

  export default LocaleZhCN;
