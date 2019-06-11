
# 毛线助手

## 当前功能

* 剔除无关内容
* 选中主内容区

## 安装

* 早期的扩展不支持该功能，请确保 MaoXian 版本为 **V0.1.27 以上**
* 安装 userScript 浏览器扩展，常见的有 Greasemonkey、 Tampermonkey， 选一个适用你浏览器的安装即可。

* [安装本助手](https://mika-cn.github.io/maoxian-web-clipper/assistant/index.user.js)

## 参与进来

如果你不会编程，你可以在项目 [issue 页面](https://github.com/mika-cn/maoxian-web-clipper/issues) 提交适配请求(提供需要适配的网址)，或者回馈某个网站适配不正确的信息，开发人员会适时跟进。

下文为维护网站适配信息，开发者，需要了解的内容

网站适配信息，存储在 [website.yaml](website.yaml) 里面，里面定义了许多 Plan，每个 Plan 定义了该选中哪个元素，该剔除哪些元素。毛线助手会根据 Plan 描述的信息，执行相关操作。

### Plan 的结构解释

```
name    : 字符串（必填） : 起标识作用，直接填写域名即可
pattern : 字符串（必填） : 匹配的模式，只有网址和模式匹配，该 plan 才会被应用。
pick    : 数组（必填）   : 数组存的是 Selector，脚本会按 Selector 的顺序，找到第一个匹配的元素（该元素即：将被裁剪的元素），就会停止查找。一般情况下，这里只需要填写一个 Selector。该项的 Selector 的查找范围为【整个文档】
hide    : 数组（可为空） : 数组存的是 Selector，脚本会应用每个 Selector，并把找到的元素剔除掉。该项的 Selector 的查找范围为【将被裁剪元素的内部】
```


### Selector

Selector 有两种：CSS Selector 和 xPath Selector。

Selector 的结构为 $type||$q

各部分解释如下
```
$type : C 代表 CSS, X 代表 xPath.
$q    : 选择器
```
其中 `$type||` 部分可省略，省略后的部分表示的是 CSS 的选择器。

### pattern

Pattern 目前支持 `*` 和 `**`。 `*` 星号不会匹配路径分隔符 `/`，`**` 可匹配 0 个以上的目录。

假设要匹配 `https://example.org/blog/javascript/2017/01/05/awesome-article.html` ，里面 /blog 为固定，/javascript 为文章分类（不知道有没有子分类），后面是年月日，最后是文章名。

可以用 `https://example.org/blog/**/*/*/*/*/*.html`来匹配。 中间用了四个 `*` 号来匹配分类和年月日，前面的 `**` 匹配可能存在的子分类。


### 一个例子

```yaml
- :name: example.org
  :pattern: https://*.example.org/post/*.html
  :pick:
  - article
  :hide: []
```

上面这个例子中 pick 这一项，数组里有一个 Selector，即 `article`。`article` 为 CSS 选择器，这个 Selector 的完整写法为 `C||article` 我们这里省略了 `$type||`，该 Selector 会选择网页中的所有 article 标签，毛线助手只会选取第一个作为将被裁剪的元素。而 hide 这一项没有指定 Selector，可以看到它的值为空数组。
