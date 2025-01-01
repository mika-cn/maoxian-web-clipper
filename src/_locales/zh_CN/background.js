import common from './common.js';

const values = {
  "tab.not-found": "无法找到当前激活的网页，你可以先点击要裁剪网页标签，再试一次",
  "tab.not-http": "目标网页 （ID: ${id} 标题: ${title}, 网址: ${url}） 非 HTTP 网页",
  "tab.discarded": "目标网页 （ID: ${id} 标题: ${title}, 网址: ${url}） 的内存，已被浏览器回收，请先点击目标网页，使其加载后再裁剪",
  "tab.in-reader-mode": "目标网页 （ID: ${id} 标题: ${title}, 网址: ${url}）处于阅读模式，请退出阅读模式再裁剪",
  "tab.still-loading": "目标网页 （ID: ${id} 标题: ${title}, 网址: ${url}） 仍在加载中，请等待其加载完成再裁剪",

  "native-app.version-invalid": "当前扩展依赖的「本地程序」的版本必须大于或等于 ${requiredVersion}, 但是当前安装的版本为 ${currentVersion}，请<a href='go-page:native-app#upgrade' target='_blank'>更新你的本地程序</a>",
  "native-app.not-installed": "可能是由于你的「本地程序」还没有安装或者安装未成功导致的 (<a href='go.page:native-app' target='_blank'>查看如何安装</a>)",
};

export default Object.assign(common, values);
