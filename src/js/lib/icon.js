"use strict";

import ExtApi from './ext-api.js';

const MxWcIcon = {};

MxWcIcon.setTitle = (title) => {
  ExtApi.setIconTitle(title);
}

MxWcIcon.showTabBadge = (tabId, {text = null, textColor = 'white', backgroundColor = 'green'}) => {
  ExtApi.setTabBadge(tabId, {text, textColor, backgroundColor});
}

MxWcIcon.hideTabBadge = (tabId) => {
  ExtApi.setTabBadge(tabId, {text: null});
}


// n = times * 2 - 1
MxWcIcon.flicker = (n, style) => {
  if(n > 0){
    let iconStyle = style || 'default';
    iconStyle = (iconStyle == 'default' ? 'highlight' : 'default');
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
  ExtApi.getCurrentTab().then((tab) => {
    if(tab) {
      // tab might not focus
      const path = getIconPathByStyle(tab.id, iconStyle);
      const details = {tabId: tab.id, path};
      ExtApi.setTabIcon(details);
    }
  })
}


// iconStyle: 'default', 'highlight'
function getIconPathByStyle(tabId, iconStyle) {
  let key;
  if (iconStyle == 'default') {
    key = isBrowserDarkTheme() ? 'light' : 'dark';
  } else {
    key = iconStyle;
  }

  let suffix = ({
    "dark"      : null,
    "light"     : "light",
    "highlight" : "highlight"
  })[key]

  return getIconPathAllSize(suffix);
}


/*
 * @param {String} suffix - "light" or "highlight"
 * @returns {Object} {
 *   16: "xxx.png",
 *   32: "xxx.png",
 *   48: "xxx.png
 */
function getIconPathAllSize(suffix) {
  const sizes = ['16', '32', '48'];
  return sizes.reduce((h, size) => {
    if (suffix) {
      h[size] = `/icons/mx-wc-${size}-${suffix}.png`
    } else {
      h[size] = `/icons/mx-wc-${size}.png`
    }
    return h;
  }, {});
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


// FIXME
function isBrowserDarkTheme() {
  try {
    return (window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch(e) {
    // Not working in service worker :(
    return false;
  }
}


export default MxWcIcon;
