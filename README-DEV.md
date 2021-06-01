
# Development

## Branches intro

There are two main branches called "master" and "develop".

* "master" is the production branch, this is where the published extension was built from.
* "develop" is the development branch, this is where you create your own branch from and send pull request to.


## Get involved

Generally, it's a good practise to open an issue before you dive into the code. Especially when you want to add a new feature or do something big.

### step 0.clone the codebase

1. fork it first
2. clone it

```shell
git clone https://github.com/@your_user_name/maoxian-web-clipper.git
git checkout develop
git checkout -b feat/my-own-branch
```


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

Make sure you have installed `web-ext`, runing the belowing command to check:

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
