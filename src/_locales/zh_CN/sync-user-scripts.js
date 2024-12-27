import common from './common.js';

const values = {
  "page-name": "同步用户脚本",
  "init.download-folder": '加载浏览器下载目录...',
  "hint": '请从下方选择用户脚本文件夹, 扩展将同步选中文件夹内的用户脚本。<br><br><a href="go.page:write-user-script" target="_blank">如何编写用户脚本</a>',
  "done": "完成! 已同步 $n 个用户脚本",
  "close-page": "本页面 3 秒后将自动关闭...",
};

export default Object.assign(common, values);
