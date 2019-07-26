
# 毛线助手

## 当前功能

* 选中主内容区
* 剔除无关内容
* 显示折叠内容
* 修改元素属性

## 安装

* 早期的扩展不支持该功能，请确保 MaoXian 版本为 **V0.1.27 以上**
* 安装 userScript 浏览器扩展，常见的有 Greasemonkey、 Tampermonkey， 选一个适用你浏览器的安装即可。

* [安装本助手](https://mika-cn.github.io/maoxian-web-clipper/assistant/index.user.js)

**注意：如果你有修改安装过后的 userScript 的需求，我们建议你新建一个 userScript 后，在那上面修改。这样做是为了避免你的修改被覆盖掉，因为本助手还处于频繁更新阶段。**

## 参与进来

我们欢迎各位 MaoXian 用户参与进来，只有这般，该助手才能发挥其真正的能力。如果你不会编程，你可以在项目 [issue 页面](https://github.com/mika-cn/maoxian-web-clipper/issues) 提交适配请求(提供需要适配的网址)，或者回馈某个网站适配不正确的信息，开发人员会进行跟进。

下文为维护网站适配信息，开发者，需要了解的内容

网站适配信息，存储在 [website.yaml](website.yaml) 里面，里面定义了许多 Plan，每个 Plan 定义了该选中哪个元素，剔除哪些元素等操作。毛线助手会根据 Plan 描述的信息，执行相关操作。website.yaml 里面的 Plan 最终都会转换成，javascript 对象，并被引入到 [index.user.js](index.user.js) 。

### Plan 的结构解释

| 参数名 | 类型 | 是否必填 | 备注 |
| -------- | -------- | -------- | -------- |
| name | 字符串 | 必填 | 起标识作用，直接填写域名即可 |
| pattern | 字符串 | 必填 | 匹配的模式，只有网址和模式匹配，该 plan 才会被应用。|
| pick | $SelectorInput | 必填 | 用于选择「被裁剪的元素」，更详细请看下方 |
| hide | $SelectorInput | 可选 | 用于选择「要剔除的元素」，更详细请看下方|

上方表格给出的是常用的几个参数。更多参数的说明会在后文。

#### Pattern 参数的使用

Pattern 参数描述了该 Plan 会应用到哪一类网址上，目前我们支持 `*` 和 `**`。 `*` 号不会匹配路径分隔符 `/`，`**` 可匹配 0 个以上的目录。

假设我们要匹配 `https://example.org/blog/javascript/2017/01/05/awesome-article.html` ，里面 /blog 为固定，/javascript 为文章分类（不知道有没有子分类），后面是年月日，最后是文章名。可以用 `https://example.org/blog/**/*/*/*/*/*.html`来匹配。 中间用了四个 `*` 号来匹配分类和年月日，前面的 `**` 匹配可能存在的子分类。

当然，上面这个例子也可以使用 `https://example.org/blog` 作为 Pattern ，来直接匹配以该模式打头的网址，不同的 Pattern，严格程度不同，根据需求给出 Pattern 即可。


#### $SelectorInput

$SelectorInput 只是一个抽象叫法，它表示你可以提供一个 $Selector 或者多个 $Selector。即它的类型可能是字符串或是一个数组。下面我们解释 $Selector。

Selector 有两种：CSS Selector 和 xPath Selector。它是一个字符串，结构为 `$type||$q` 。

| 变量 | 说明 | 值 |
| -------- | -------- | -------- |
| $type | 选择器的类型 | C 代表 CSS, X 代表 xPath |
| $q | 选择器 | CSS 选择器 或 xPath 选择器 |

其中 `$type||` 部分可省略，省略后的部分表示的是 CSS 的选择器，大部分情况下我们都会用 CSS 选择器，除非一些很难用 CSS 选择器表示的，才会使用到 xPath 选择器。

不同参数的 $SelectorInput 的查找范围不一样，如下：

* **pick 参数** $SelectorInput 的查找范围为**整个文档**，找到第一个匹配元素就停止查找，如果 $SelectorInput 由多个 $Selector 构成，会按照顺序查找。

* **hide 参数** $SelectorInput 的查找范围为**将被裁剪元素的内部**，所有 $Selector 找到的元素都会被剔除掉。

下面我们给出一个例子

```yaml
- name: example.org
  pattern: https://www.example.org/article/*
  pick: article
  hide:
  - div.state-bar
  - div.comment
  - X||//span[text()="更多请关注"]
```

* pick 填入的是一个 $Selector ，此 $Selector 是 CSS 选择器。其完整形式为 `C||article`，我们给出的是省略了 `C||` 后的部分。
* hide 填入的是多个 $Selector ，即给出的是一个 $Selector 的元组（数组）。最后一个 $Selector 是 xPath 选择器，其 `X||` 部分不能省略。

#### show 参数的使用

show 参数是用于显示隐藏的块状元素的，属性的值也是 $SelectorInput，show 比较特殊，它**只可用于块状元素（即display 的值为 block）**。它会将元素的 display 样式设置成 block 来让这个元素显示出来. 它相对于后文会提到的 chAttr 参数比较简单，如果要操作的元素都为块状元素，则使用 show 会比较方便，否则，请考虑使用 chAttr 参数（具体查看 chAttr 的例4）

#### chAttr 参数的使用

chAttr 参数可以用来改变标签的某个属性的值。chAttr 是一个可选项，只有在需要的时候，才需要提供。 chAttr 的值为一个 $action 的数组，$action 是一个 Object。Object 的常用参数有三个 `pick`, `attr`, `type`。不同的 `type` 会跟不同的的参数。下面我们用例子来说明 chAttr 的用法。

---------------------------

1. 假设有一个网页，显示的是低质量的图，这些图的 `src` 属性是一个有规律的地址，比如： `https://www.example.org/images/awesome-pic-small.jpg`  ，而某些操作后，可能就变为 `https://www.example.org/images/awesome-pic-big.jpg` 。我们希望裁剪的是后者，而非前者，可以用下面这个 Plan 来实现：

```yaml
- name: example.org
  pattern: https://www.example.org/post/*
  pick: article
  hide: div.comment
  chAttr:
  - type: self.replace
    pick: img
    attr: src
    subStr: small
    newStr: big
```

上面 Plan 中的 chAttr 参数的值是一个数组，里面包含了一个 $action，它的各个属性解读如下：

* type 的值为 **self.replace** ，表示这个 $action 是将**找到的元素的属性的值的某个部分**，进行替换操作。
* pick 的类型为 $SelectorInput，用来选中要操作的元素，我们选中了所有 img 标签。
* attr 的值为要操作的属性名字，此例中，我们选择的是 src 属性。
* subStr 的值为**要替换掉的那部分**，我们填入的是 small。
* newStr 的值是替换项，也就是说我们用 newStr 的值 big，替换 subStr 的值 small。

我们这里说的替换操作，不会替换所有找到的 subStr，而是只替换最后一个。

**注意: $action 的 pick 参数的查找范围为「将被裁剪元素的内部」**，在此例子中，查找范围是第一个 article 元素的内部。


---------------------------

2. 假设有一个网页，显示的是低质量的图，它的高质量图片地址，放在了 img 标签的另一个属性上。图片的 html 如下：

```html
<img src="/image/pic-abc.jpg" hq-src="/image/pic-bdf.jpg" />
```
我们要裁剪的是 hq-src 指定的那张图片，使用下面这个 Plan 实现：


```yaml
- name: example.org
  pattern: https://www.example.org/post/*
  pick: div.post-content
  hide:
  - div.comment
  - div.state-bar
  chAttr:
  - type: self.attr
    pick: img
    attr: src
    tAttr: hq-src
```
* type 为 **self.attr** ，它表明我们要用**找到元素的另一个属性的值**，来重写 attr 指定的属性。
* pick 的类型为 $SelectorInput，用来选中要操作的元素，我们选中了所有 img 标签。
* attr 的值为要操作的属性名字，此例中，我们选择的是 src 属性。
* tAttr 的值为目标属性（target attribute）的名字， 此例中，我们用 hq-src 属性重写 src 属性。

---------------------------

3. 假设有一个网页，显示的是低质量的图，并且这些图片本身是一个链接，可以通过点击图片查看原图， 图片的 html 如下：

```html
<a href="/image/awesome-pic-bdf.jpg" >
  <img src="/image/pic-abc.jpg" />
</a>
```
我们要裁剪的是 a 标签 href 指定的那张图片，使用下面这个 Plan 实现：

```yaml
- name: example.org
  pattern: https://www.example.org/post/*
  pick: div.post
  hide:
  - div.comment
  - div.state-bar
  chAttr:
  - type: parent.attr
    pick: img
    attr: src
    tAttr: href
```

* type 为 **parent.attr** ，它表明我们要用找到元素的**父元素**的一个属性的值，来重写 attr 指定的属性。
* pick 的类型为 $SelectorInput，用来选中要操作的元素，我们选中了所有 img 标签。
* attr 的值为要操作的属性名字，此例中，我们选择的是 src 属性。
* tAttr 的值为目标属性（target attribute）的名字， 此例中，我们用父元素的 href 属性重写 src 属性。

---------------------------

4. 除了上面这几种 $action, chAttr 还对 class 属性的修改做了支持。请看下方 Plan:

```yaml
- name: example.org
  pattern: https://www.example.org/post/*
  pick: article
  hide: div.comment
  chAttr:
  - type: self.remove
    pick: ".section"
    attr: class
    value: folded
    sep: ' '
```

* type 为 **self.remove** ，它表明我们要用操作的属性具有的值比较特殊，可以通过某个分隔符分成多个部分，该类型表明要移除其中一部分。
* pick 的类型为 $SelectorInput，用来选中要操作的元素，我们选中了所有包含类名为 section 的标签。
* attr 的值为要操作的属性名字，此例中，我们选择的是 class 属性。此项可不填，默认为 class。
* value 为要移除的那部分。
* sep 为分隔符，此项可不填，默认为空格

还有一种 $action, 跟该例子类似，它的类型为 **self.add**，该值表明要往属性里面添加一项。

该 Plan 出于演示的目的，列出了所有的参数，若忽略可不填的参数，可简化为：

```yaml
- name: example.org
  pattern: https://www.example.org/post/*
  pick: article
  hide: div.comment
  chAttr:
  - type: self.remove
    pick: ".section"
    value: folded
```

一般可以使用这两种 $action ，对网页折叠部分进行控制，使其达到我们想要的状态。这种方式不像上文的 show 参数那样粗暴地对 display 进行操控，但是我们建议在能使用 show 的情况下，还是使用 show，简单一些。
