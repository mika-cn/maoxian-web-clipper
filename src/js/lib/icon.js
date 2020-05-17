"use strict";

import ExtApi from './ext-api.js';

//const browser = require('webextension-polyfill');

const MxWcIcon = {};

// n = times * 2 - 1
MxWcIcon.flicker = (n, style) => {
  if(n > 0){
    let iconStyle = (style || "default");
    iconStyle = (iconStyle == "default" ? "highlight" : "default");
    setTimeout(() => {
      MxWcIcon.change(iconStyle);
      MxWcIcon.flicker( n - 1, iconStyle);
    }, 400)
  }
}

/*
 * @param {string} iconStyle - default Or highlight
 */
MxWcIcon.change = (iconStyle) => {
  let icon_path = ({
    "default": 'icons/mx-wc-32.png',
    "highlight": 'icons/mx-wc-32-highlight.png'
  })[iconStyle]
  let url = browser.extension.getURL(icon_path);
  ExtApi.getCurrentTab().then((tab) => {
    if(tab) {
      // tab might not focus
      MxWcIcon.getImageData(url, function(imgData){
        browser.browserAction.setIcon({imageData: imgData, tabId: tab.id});
      });
    }
  })
}

// getImageData by icon url
MxWcIcon.getImageData = (url, cb) => {
  let canvas = document.createElement('canvas');
  let context = canvas.getContext('2d');
  let img = new Image();
  img.onload = function(){
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0 );
    cb(context.getImageData(0, 0, img.width, img.height));
  }
  img.src = url;
}

export default MxWcIcon;
