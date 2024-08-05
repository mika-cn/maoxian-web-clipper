
import T           from '../js/lib/tool.js';
import ExtMsg      from '../js/lib/ext-msg.js';
import Inspector   from '../js/lib/inspector.js';

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


async function renderEnvironment() {
  const env = await Inspector.environment();
  T.setHtml('.environment .content code', T.toJson(env));
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
  const {
    totalBytes,
    clipsBytes,
    config,
    assistantData,
    selectionData,
    miscData,
    categories,
    clippings,
    tags,
    failedTasks,
    allKeys,
  } = await Inspector.storage();

  if (!isNaN(totalBytes)) {
    const html = `<h4>total used: <em>${totalBytes}</em> Bytes</h4>`;
    T.setHtml('.storage .usedBytes', html);
  }


  if (!isNaN(clipsBytes)) {
    const html = `<em>${clipsBytes}</em> Bytes`
    T.setHtml('.storage .clippings .usedBytes', html);
  }

  T.setHtml('.storage .config code', T.escapeHtml(T.toJson(config)));
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
  T.setHtml('.storage .allKeys code', T.toJson(allKeys));
  T.setHtml('.storage .allKeys .num', allKeys.length);
}


function init() {
  initListener();
  renderEnvironment();
  renderAssetCache();
  renderStorage();
}

init();
