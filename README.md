
# MaoXian Web Clipper

[Home Page](https://mika-cn.github.io/maoxian-web-clipper/index.html)

## Intro

MaoXian Web Clipper is a browser extension to clip information from web page and save it to your **local machine** to avoid information invalidation.

That's it, Not bored registration, Not charged.


## Features

* Local Storage - All file will save in local hard disk, you can control your data totally (e.g. Use dropbox to sync files)
* Free Selection - You can select which area you want to clip.
* Adjust selection - After you select a area, you can adjust your selection use hotkeys.
* Category And Tag - Before your clipping, you can change title, input category and some tags.
* Clipping History - Extension will record clipping history, and support search history (through title/category/tag).
* Reset History - When you install this extension in new computer, you can reset your clipping history

## Software Preview
* [screenshots](https://mika-cn.github.io/maoxian-web-clipper/screenshots.html)

## Install

* Firefox - [https://addons.mozilla.org/en-US/firefox/addon/maoxian-web-clipper/](https://addons.mozilla.org/en-US/firefox/addon/maoxian-web-clipper/)
* Chrome - [https://chrome.google.com/webstore/detail/maoxian-web-clipper/kjahokgdcbohofgdidndeiaigkehdjdc](https://chrome.google.com/webstore/detail/maoxian-web-clipper/kjahokgdcbohofgdidndeiaigkehdjdc)
* Chrome - [install by crx](https://mika-cn.github.io/maoxian-web-clipper/chrome-install-by-crx.html)

## Get involved

You should create your own branch from develop and send a pull request back to it.

### step 1. install dependencies

```shell
npm install
```

If you want to use `web-ext` to run this project which is highly recommended. you need to install `web-ext`, run belowing command to install it.

```shell
npm install -g web-ext
```

### step 2. watch the project

```shell
npm run watch
```

This command will watch the project's code and automatically compile it.  All compiled code will be placed in `dist/extension/maoxian-web-clipper`.

### step 3. run the project

In this step, we will install MaoXian (sources in `dist/extension/maoxian-web-clipper`) to the browser. There are two methods to install it.

**method A: install it using `web-ext` command.**

Make sure you have installed `web-ext`, runing belowing command to check:

```shell
web-ext --version
```

after that, change directory to project's root directory, then run the command according to your browser:

On Firefox, run:

```shell
npm run dev-firefox
```

On Chromium, run:

```
npm run dev-chromium
```

The command above will automatically start the target browser (with a temporary profile) and install MaoXian on it. after that, it'll watch the prject and automatically reload the extension when source files change.

Use `npm run dev-firefox-lazy` or `npm run dev-chromium-lazy` to disable the auto reload behavior. these two commands are very useful when you are developing a extension page (in this case, you don't need to reload the entire extension but only the target extension page)



**method B: install it manually**

If you use Chrome (or Chromium) to developing.

* Go to extensions page (by visit url: `chrome://extensions/`)
* Enable developer mode
* Load unpacked (select `dist/extension/maoxian-web-clipper`)

If you use Firefox to developing.

* Go to debugging page (by visit url: `about:debugging`)
* Check _Enable add-on debugging_
* Load Temporary Add-on (select `dist/extension/maoxian-web-clipper`)



**Testing**

```shell
npm test
```


## Third party library

Thanks to these awesome libraries for making MaoXian's development become easier.

* [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)
* [JavaScript-MD5](https://github.com/blueimp/JavaScript-MD5)
* [i18njs](http://i18njs.com/)
* [turndown](https://github.com/domchristie/turndown)
* [turndown-plugin-gfw](https://github.com/domchristie/turndown-plugin-gfm)
* [mathml2latex](https://github.com/mika-cn/mathml2latex)
* [strip-css-comments](https://github.com/sindresorhus/strip-css-comments)
* [css-selector-generator](https://github.com/fczbkk/css-selector-generator)
* [awesomplete](https://github.com/LeaVerou/awesomplete)
* [pikaday](https://github.com/Pikaday/Pikaday)


## Contribution
You could help MaoXian Web Clipper development in many ways.

* [Sending feedback and suggestion](https://github.com/mika-cn/maoxian-web-clipper/issues).
* Spread and promote this extension to your friend. Popularity is a strong power to drive developers.
* If you're software developer, pull requests are welcome.
