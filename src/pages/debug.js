

import T      from '../js/lib/tool.js';
import ExtMsg from '../js/lib/ext-msg.js';
import MxWcStorage from '../js/lib/storage.js';


import './_base.css';
import './debug.css';



function renderAssetCache() {
  ExtMsg.sendToBackground({
    type: 'asset-cache.peek'
  }).then((items) => {
    const tpl = T.findElem('asset-cache-tpl').innerHTML;
    const html = items.map((it) => {
      const headersHtml = it.headers.map((header) => {
        return `<strong>${header.name}:</strong> <span>${header.value}</span>`;
      }).join("<br />");

      return T.renderTemplate(tpl, {
        link: it.link,
        headersHtml: headersHtml,
        byteSize: it.byteSize
      });
    }).join('<hr />');
    T.setHtml('.asset-cache .cache-details div', html);
    T.setHtml('.asset-cache .num', items.length);
  });
}

function renderStorage() {
  MxWcStorage.getAll().then((data) => {
    T.setHtml('.storage .config code', T.toJson(data.config));
    const assistantData = T.sliceObjByFilter(data, T.prefixFilter('assistant', true));
    const selectionData = T.sliceObjByFilter(data, T.prefixFilter('selectionStore', true));
    const miscData = T.sliceObjByFilter(data, ...[
      T.attributeFilter('config', false),
      T.attributeFilter('clips', false),
      T.prefixFilter('assistant', false),
      T.prefixFilter('selectionStore', false),
      (key) => { return true },
    ])

    T.setHtml('.storage .assistant code', T.toJson(assistantData));
    T.setHtml('.storage .selection code', T.toJson(selectionData));
    T.setHtml('.storage .misc code', T.toJson(miscData));
  });
}


function init() {
  renderAssetCache();
  renderStorage();
}

init();
