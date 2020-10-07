

import T      from '../js/lib/tool.js';
import ExtMsg from '../js/lib/ext-msg.js';


import './_base.css';
import './debug.css';



function renderAssetCache() {
  ExtMsg.sendToBackground({
    type: 'asset-cache.peek'
  }).then((items) => {
    console.log(items);
    const tpl = T.findElem('asset-cache-tpl').innerHTML;
    console.log(tpl);
    const html = items.map((it) => {
      console.log(it);
      const headersHtml = it.headers.map((header) => {
        return `<strong>${header.name}:</strong> <span>${header.value}</span>`;
      }).join("<br />");

      console.log(it);
      console.log(headersHtml);

      return T.renderTemplate(tpl, {
        link: it.link,
        headersHtml: headersHtml,
        byteSize: it.byteSize
      });
    }).join('<hr />');
    T.setHtml('.asset-cache > .content', html);
    T.setHtml('.asset-cache .num', items.length);
  });
}


function init() {
  renderAssetCache();
}

init();
