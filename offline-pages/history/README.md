
# history offline page

## intro

This is a static page, which supports list and search clipping history like the MaoXian's history page does. use this page, you can browse your clippings offline.

version: 0.0.4

## Usage

[Download it](#not-ready-yet) && extract it.

### STEP 1: Move directory

 Move extracted directory to storage path (default: `$downloads/mx-wc`)

### STEP 2: Open it with browser

Use your favourite browser open that `$downloads/mx-wc/history/index.html`

### STEP 3: Configure MaoXian extension

After step 2, you'll find two sample clipping history which is store in `clippings.js`. `clipping.js` is the file which `index.html` will load clipping history from. You should configure your `MaoXian Web Clipper` to generate it automatically.

### Warning

If your storage path is not `$downloads/mx-wc`, you should change the `rootFolder` item in `history/config.js`.
