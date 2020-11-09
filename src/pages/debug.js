
import T           from '../js/lib/tool.js';
import ExtMsg      from '../js/lib/ext-msg.js';
import MxWcStorage from '../js/lib/storage.js';
import MxWcConfig  from '../js/lib/config.js';
import MxWcLink    from '../js/lib/link.js';

function initListener() {
  const btn = T.findElem('clear-asset-cache');
  T.bindOnce(btn, 'click', clearAssetCache);
}

function clearAssetCache() {
  ExtMsg.sendToBackground({
    type: 'asset-cache.reset'
  }).then(() => {
    renderAssetCache();
  });
}

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

async function renderStorage() {
  const logErrMsg = function(errMsg) { console.log(errMsg) }
  MxWcStorage.getTotalBytes().then((n) => {
      const html = `<h4>total used: <em>${n}</em> Bytes</h4>`;
      T.setHtml('.storage .usedBytes', html);
    }, logErrMsg
  );
  MxWcStorage.getBytesInUse('clips').then((n) => {
      const html = `<em>${n}</em> Bytes`
      T.setHtml('.storage .clippings .usedBytes', html);
    }, logErrMsg
  );
  const config = await MxWcConfig.load();
  const data = await MxWcStorage.getAll();

  const assistantData = T.sliceObjByFilter(data, T.prefixFilter('assistant', true));
  const selectionData = T.sliceObjByFilter(data, T.prefixFilter('selectionStore', true));
  const miscData = T.sliceObjByFilter(data, ...[
    T.attributeFilter('config', false),
    T.attributeFilter('clips', false),
    T.attributeFilter('categories', false),
    T.attributeFilter('tags', false),
    T.prefixFilter('assistant', false),
    T.prefixFilter('selectionStore', false),
    (key) => { return true },
  ])

  const categories = (data.categories || []);
  const clippings = (data.clips || []);
  const tags = (data.tags || []);
  const failedTasks = (data.failedTasks || []);

  T.setHtml('.storage .config code', T.toJson(MxWcConfig.unsort(config)));
  T.setHtml('.storage .assistant code', T.toJson(assistantData));
  T.setHtml('.storage .selection code', T.toJson(selectionData));
  T.setHtml('.storage .misc code', T.toJson(miscData));
  T.setHtml('.storage .clippings code', T.toJson(clippings));
  T.setHtml('.storage .clippings .num', clippings.length);
  T.setHtml('.storage .categories code', T.toJson(categories));
  T.setHtml('.storage .categories .num', categories.length);
  T.setHtml('.storage .tags code', T.toJson(tags));
  T.setHtml('.storage .tags .num', tags.length);
  T.setHtml('.storage .failed-tasks code', T.toJson(failedTasks));
  T.setHtml('.storage .failed-tasks .num', failedTasks.length);
}


function init() {
  MxWcLink.listen();
  initListener();
  renderAssetCache();
  renderStorage();
}

init();
