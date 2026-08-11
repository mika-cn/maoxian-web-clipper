
# Development

## Branches intro

There are two main branches called "main" and "dev".

* "main" is the production branch, this is where the published extension was built from.
* "dev" is the development branch, this is where you create your own branch from and send pull request to.


## Get involved

Generally, it's a good practise to open an issue before you dive into the code. Especially when you want to add a new feature or do something big.

### step 0. clone the codebase

1. fork it first
2. clone it

```shell
git clone https://github.com/@your_user_name/maoxian-web-clipper.git
git checkout dev
git checkout -b feat/my-own-branch
```


### step 1. install dependencies

You need to have node and yarn installed first, then just run:

```shell
yarn install
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

### step 3. build the project

To build the extension,

For Firefox, run:

```shell
npm run build-firefox
```

For Chromium, run:

```shell
npm run build-chromium
```

After the building, All compiled code will be placed in `dist/extension/maoxian-web-clipper`.


### step 4. install the extension to your browser

In this step, we will install MaoXian (sources in `dist/extension/maoxian-web-clipper`) to the browser.

If you use Chromium to developing.

* Go to extensions page (by visit url: `about:extensions`)
* Turn developer mode on
* Load unpacked (select `dist/extension/maoxian-web-clipper`)

If you use Firefox to developing.

* Go to debugging page (by visit url: `about:debugging`)
* Click _This Firefox_
* Load Temporary Add-on (select `dist/extension/maoxian-web-clipper`)


## Testing

```shell
npm test
```
