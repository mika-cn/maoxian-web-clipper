
# Development

## Branches intro

There are two main branches called "master" and "develop".

* "master" is the production branch, this is where the published extension was built from.
* "develop" is the development branch, this is where you create your own branch from and send pull request to.


## Get involved

Generally, it's a good practise to open an issue before you dive into the code. Especially when you want to add a new feature or do something big.

### step 0. clone the codebase

1. fork it first
2. clone it

```shell
git clone https://github.com/@your_user_name/maoxian-web-clipper.git
git checkout develop
git checkout -b feat/my-own-branch
```


### step 1. install dependencies

Note that the develop environment of node is 18.15.0 (with npm 9.5.0). You better installing a latest stable one.

```shell
npm install
```

If you want to use `web-ext` to run this project which is highly recommended. you need to install `web-ext`, run belowing command to install it.

```shell
npm install -g web-ext
```

### step 2. define the required environment variables

You can copy the belowing code to your shell (such as /home/username/.bashrc) and restart your terminal.

```shell
# ================================
# MaoXian development env
# ================================

export MX_DEV_CHROMIUM_ID="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAm/MHQbzfXMM/OBfPLvHRq1600omN/wra4Frbe+Rzpga5lDmycWuxlTrhKXyzF01YS5QCvNSYVS1NGNr4lHYE8UK0TJNaYViA9WFLdA3Q2Wqt9grvIuXJ8jZVgcZPgvLfOOiFuDypPbayWUEU0JPWtZHqXILnS9S+i6c8n3+nev+Khc0XHc2/QnrKUZqce3ZMXOQ7auzfExQB225GoitTy6K+SpFln3v1o9SE4cJkca+iTcPVlHDwsCm7ZnwSmAWv3Fz7BGmCg6zwsz/w31O85rNgHR0K3qNZCHXJVvN08ny8tQ9E6VdOkWCQzEOh75WJTu8tXi8s35QWKKQAv1aCoQIDAQAB"
export MX_DEV_CHROMIUM_UPDATE_URL=""
# export MX_DEV_CHROMIUM_UPDATE_URL="http://dev.pc:3000/maoxian-web-clipper/extension/chrome-updates.xml"

export MX_DEV_FIREFOX_ID="maoxian-web-clipper@dev.whatever.org"
```

### step 3. watch the project


For Firefox, run:

```shell
npm run watch-firefox
```

For Chromium, run:

```shell
npm run watch-chromium
```

The watch command will watch the project's code and automatically compile it.  All compiled code will be placed in `dist/extension/maoxian-web-clipper`.

### step 4. run the project

In this step, we will install MaoXian (sources in `dist/extension/maoxian-web-clipper`) to the browser. There are two methods to install it.

**method A: install it using `web-ext` command.**

Make sure you have installed `web-ext`, runing the belowing command to check:

```shell
web-ext --version
```

after that, change directory to project's root directory, then run the command according to your browser:

For Firefox, run:

```shell
npm run dev-firefox
```

For Chromium, run:

```
npm run dev-chromium
```

The command above will automatically start the target browser (with a temporary profile) and install MaoXian on it. after that, it'll watch the prject and automatically reload the extension when source files change.

Use `npm run dev-firefox-lazy` or `npm run dev-chromium-lazy` to disable the auto reload behavior. these two commands are very useful when you are developing a extension page (in this case, you don't need to reload the entire extension but only the target extension page)



**method B: install it manually**

If you use Chromium to developing.

* Go to extensions page (by visit url: `about:extensions`)
* Turn developer mode on
* Load unpacked (select `dist/extension/maoxian-web-clipper`)

If you use Firefox to developing.

* Go to debugging page (by visit url: `about:debugging`)
* Check _Enable add-on debugging_
* Load Temporary Add-on (select `dist/extension/maoxian-web-clipper`)



**Testing**

```shell
npm test
```
