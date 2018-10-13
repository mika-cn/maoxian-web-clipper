
const MxWcTemplate = {}

MxWcTemplate.popupPageMenus = {
  render: function(v){
    const icons = {
      "last-result" : "fas fa-check-square active",
      "clip"        : "fas fa-crop",
      "history"     : "fas fa-bars",
      "setting"     : "fas fa-cog",
      "home"        : "fas fa-home",
    }
    let html = "";
    v.menuIds.forEach(function(menuId){
      html += `<a class="menu" data-id="${menuId}"><i class="${icons[menuId]}"></i>${t("popup.menu." + menuId)}</a>`
    });
    return html;
  }
}

MxWcTemplate.resetPageSelector = {
  render: function(v){
    return `
        <div class="notice-info">
          ${t('reset.hint')}
        </div>
        <input id="myInput" type="file" accept="application/json" webkitdirectory directory/>
        <button id="reset-btn" >${t('btn.confirm')}</button>
    `;
  }
}

MxWcTemplate.welcomePage = {
  render: function(v) {
    return `
      <div class="installation-hint green">
        <center><h1>${t('welcome.installation-hint')}</h1></center>
      </div>
      <div class="notice-info">
        <h2 class="green">${t('welcome.sayhi')}</h2>
        <p>${t('welcome.extra-intro')}</p>
        <p>${this.extraStep1(v)}</p>
        <p>${this.extraStep2(v)}</p>
      </div>

      <div class="notice-info">
        <p>${t('welcome.notice')}</p>
      </div>
      <div>
        <p>${this.lastHint(v)}</p>
      </div>
    `
  },
  extraStep1: function(v){
    if(v.isChrome){
      return t('welcome.extra-1-chrome');
    } else {
      return t('welcome.extra-1-firefox');
    }
  },
  extraStep2: function(v){
    if(v.isChrome) {
      let html = t('welcome.extra-2-chrome');
      html = html.replace('$extensionLink',
        `<a href='' link='${v.chromeExtensionDetailPageUrl}' class='tab-link'>chrome-extensions</a>`
      );
      return html;
    } else {
      let html = t('welcome.extra-2-firefox');
      html = html.replace('$allowFileUrlAccessLink',
        `<a href="${MxWcLink.get('faq-allow-access-file-urls')}" target="_blank">Allow Access File URLs</a>`
      );
      return html;
    }
  },
  lastHint: function(v) {
    const linkHtml = `<a href=${MxWcLink.get('faq')} target='_blank'>FAQ</a>`;
    return t('welcome.last-hint').replace('$faqLink', linkHtml);
  }
}

MxWcTemplate.settingPage = {
  render: function(v){
    return `
      <section class="setting-format">
        <h3>${t('setting.title.save-format')}</h3>
        <div class="options" id="setting-format">
          <a data-value="html">HTML</a>
          <a data-value="md">Markdown</a>
        </div>
      </section>
      <section class="setting-clipping-handler">
        <h3>${t('setting.title.clipping-handler')}</h3>
        <div class="notice-info">
          <p>
             ${t('setting.notice.clipping-handler.intro')}
             <br />
            <a href="${v.nativeAppUrl}" target="_blank">${t('setting.notice.clipping-handler.link-label')}</a><br />
          </p>
        </div>
        <div class="options" id="clipping-handler">
          <a data-value="browser">${t('setting.clipping-handler-option.browser')}</a>
          <a data-value="native-app">${t('setting.clipping-handler-option.native-app')}</a>
        </div>
      </section>
      <section class="setting-clipping-content">
        <h3>${t('setting.title.clipping-content')}</h3>
        <p>
          <input type="checkbox" id="save-clipping-information" /><label> ${t('setting.clip-information-input.label')}</label>
          <br /><input type="checkbox" id="save-web-font" /><label> ${t('setting.save-web-font-input.label')}</label>
          <br /><input type="checkbox" id="save-domain-as-tag" /><label> ${t('setting.save-domain-tag-input.label')}</label>
        </p>
      </section>
      <section class="setting-path">
        <h3>${t('setting.title.path')}</h3>
        <p>
               <input type="checkbox" id="save-title-as-fold-name" /><lable> ${t('setting.save-title-as-fold-name-input.label')}</label>
          <br /><input type="checkbox" id="save-title-as-filename" /><lable> ${t('setting.save-title-as-filename-input.label')}</label>

          <div class="notice-info"> ${t('setting.notice.asset-path')} </div>
          <input type="text" id="asset-path" placeholder="${t('setting.placeholder.notblank')}"/>
          <br />
          <div class="notice-info"> ${t('setting.notice.default-category')}</div>
          <input type="text" id="default-category" placeholder="${t('setting.placeholder.notblank')}"/>
          <br />
          <div class="notice-info"> ${t('setting.notice.default-clipping-folder-format')}</div>
          <input type="text" id="default-clipping-folder-format" placeholder="${t('setting.placeholder.notblank')}"/>
        </p>
      </section>
      <section class="setting-file-scheme-access">
        <h3>${t('setting.title.file-url')}</h3>
        <p>
          <div class="notice-info">
            ${t('setting.notice.file-url.intro')}<br />

            <a href="${v.settingFileUrlLink}" target="_blank">${t('setting.notice.file-url.link-label')}</a><br />

            ${t('setting.notice.file-url.help-msg')} <br />
            ${t('setting.notice.file-url.ext-id')} => ${v.host}
          </div>
          <div class="notice-warning">
            <strong>${t('setting.warning')}:</strong><br />
            ${t('setting.notice.file-url-warning')}
          </div>
          <input type="checkbox" id="file-scheme-access-input"/><label> ${t('setting.file-url-input.label')}</label>
        </p>
      </section>
      <section class="setting-hotkey">
        <h3>${t('setting.title.hotkey')}</h3>
        <p>
          <input type="checkbox" id="enable-switch-hotkey" /><label> ${t('setting.enable-switch-hotkey-input.label')}</label>
        </p>
      </section>
    `;
  }
}


MxWcTemplate.historyPageSearchFields = {
  render: function(v){
    return `
<input id="${v.inputId}" type="text" placeholder="${t('history.input.placeholder')}"/>
<button id="${v.btnId}">${t('history.btn.search')}</button>
    `
  }
}

MxWcTemplate.historyPageClips = {
  render: function(v){
    const clips = v.clips;
    let html = t('history.no_record');
    if(clips.length > 0){
      html = "<table>";
      html += `
        <thead>
          <tr>
            <td>${t('history.th.time')}</td>
            <td>${t('history.th.category')}</td>
            <td>${t('history.th.tag')}</td>
            <td>${t('history.th.title')}</td>
          </tr>
        </thead><tbody>`;
      clips.forEach(function(clip){
        html += MxWcTemplate.historyPageClips.renderClip(clip);
      });
      html += "</tbody></table>";
    }
    return html;
  },
  renderClip: function(clip){
    return `
      <tr data-id="${clip.clipId}">
        <td>${this.renderTime(clip.created_at)}</td>
        <td>${clip.category}</td>
        <td>${clip.tags.join(", ")}</td>
        <td>${clip.title}</td>
      </tr>`;
  },
  renderTime: function(tStr){
    const t = T.currentTime().str;
    return [t.month, t.day].join('/')
  }
}

MxWcTemplate.historyPageClipDetail = {
  render: function(v){
    let pathRow = "";
    switch(v.urlAction){
      case 'openUrlDirectly':
      case 'openUrlByDownloadItem':
        pathRow = `
          <tr>
            <th>${t('history.th.path')}</th>
            <td><a class="path-link" href="">${v.url}</a>
            </td>
          </tr>`;
        break;
      case 'openUrlByCopyAndPaste':
        pathRow =`
          <tr>
            <th>${t('history.th.path')}</th>
            <td>
              <input type="text" class='path' readonly="true" value="${v.url}" />
            </td>
          </tr>`;
        break;
    }

    return `
      <table>
        <tbody>
          <tr>
            <th>${t('history.th.title')}</th><td>${v.clip.title}</td>
          </tr>
          ${pathRow}
        </tbody>
      </table>
      <table>
        <tbody>
          <tr>
            <th>${t('history.th.time')}</th><td>${v.clip.created_at}</td>
            <th>${t('history.th.category')}</th><td>${v.clip.category}</td>
          </tr>
          <tr>
            <th>${t('history.th.tag')}</th><td>${v.clip.tags.join(",")}</td>
            <th>${t('history.th.format')}</th><td>${v.clip.format}</td>
          </tr>
        </tbody>
      </table>
    `;
  }
}

MxWcTemplate.UIHtml = {
  render: function(v){
    return `
<div class="${v.g} MX-wc-bar idle">
  <label class="${v.g} ${v.c.hint}">-</label><label class="${v.g}" id="${v.id.btn}" ></label>
</div>
<div class="${v.g} MX-wc-help">
  <div class="help-group">
    <table>
      <tr><td class="intro">${t('hotkey.left.intro')}</td><td><kbd>←</kbd></td></tr>
      <tr><td class="intro">${t('hotkey.right.intro')}</td><td><kbd>→</kbd></td></tr>
      <tr><td class="intro">${t('hotkey.up.intro')}</td><td><kbd>↑</kbd></td></tr>
      <tr><td class="intro">${t('hotkey.down.intro')}</td><td><kbd>↓</kbd></td></tr>
    </table>
  </div>
    <div class="help-group">
      <table>
        <tr><td class="intro">${t('click.scroll.intro')}</td><td><kbd>${t('click')}</kbd></td></tr>
        <tr><td class="intro">${t('hotkey.esc.intro')}</td><td><kbd>esc</kbd></td></tr>
      </table>
    </div>
</div>
<div class="${v.g} MX-wc-form">
  <div class="${v.g} MX-input-group">
    <label class="${v.g}">${t('title')}</label>
    <input class="${v.g}" type="text" id="${v.id.title}"/>
  </div>
  <div class="${v.g} MX-input-group">
    <label class="${v.g}">${t('category')}</label>
    <input class="${v.g}" type="text" id="${v.id.category}" placeholder="${t('hint.category')}"/>
  </div>
  <div class="${v.g} MX-input-group">
    <label class="${v.g}">${t('tags')}</label>
    <input class="${v.g}" type="text" placeholder="${t('hint.tags')}" id="${v.id.tagstr}" />
  </div>
  <div class="${v.g} MX-wc-actions">
    <a tabindex="0" class="${v.g} MX-wc-action ${v.c.save}">${t('save')}</a>
    <a tabindex="0" class="${v.g} MX-wc-action ${v.c.cancel}">${t('cancel')}</a>
  </div>
</div>`;
  }
}

MxWcTemplate.framePage = {
  render: function(v){
    return `
<!DOCTYPE html>
<html>
  <!-- ${v.originalSrc} -->
  <head>
    <meta http-equiv="Content-Type" content="text/html"; charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${v.title}</title>
    ${v.styleHtml}
  </head>
  ${v.html}
</html>`;
  }
}

MxWcTemplate.elemPage = {
  render: function(v){
  return `
<!DOCTYPE html>
<html>
  <!-- OriginalSrc: ${v.info.link} -->
  <head>
    <meta http-equiv="Content-Type" content="text/html"; charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${v.info.title}</title>
    ${v.styleHtml}
    <style>
      .mx-wc-main img {max-width: 100%;}
      .mx-wc-main{
        box-sizing: content-box;
        background-color: ${v.outerElemBgCss};
        margin: 0 auto;
        max-width: ${v.elemWidth}px;
        padding: 15px 15px 80px 15px;
        border: 1px solid #ccc;

      }
      .mx-wc-main > .clipping-information{
        text-align: left;
        margin-top: 20px;
        background-color: #eeeeee;
        padding: 15px;
        border-radius: 4px;
        color: #333;
        font-size: 14px;
        line-height: 22px;
      }
      .mx-wc-main > .clipping-information a { color: blue; }
      .mx-wc-main > .clipping-information label { display: inline; }

    </style>
  </head>
  <body style="background-color: ${v.bodyBgCss}; min-height: 100%; height: auto;" id="${v.bodyId}" class="${v.bodyClass}">
    <div class="mx-wc-main">
      ${v.elemHtml}
      ${MxWcTemplate.clippingInformation.render(v)}
    </div>
  </body>
</html>`;
  }
}

MxWcTemplate.bodyPage = {
  render: function(v) {
    let elemHtml = v.elemHtml.replace(/<body>/i, '');
    elemHtml = elemHtml.replace(/<\/body>/i, '');
    elemHtml = `<div id="${v.bodyId}" class="${v.bodyClass}">${elemHtml}</div>`;
  return `
<!DOCTYPE html>
<html>
  <!-- OriginalSrc: ${v.info.link} -->
  <head>
    <meta http-equiv="Content-Type" content="text/html"; charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${v.info.title}</title>
    ${v.styleHtml}
    <style>
      .mx-wc-main img {max-width: 100%;}
      .mx-wc-main{
        margin: 0 auto;
      }
      .mx-wc-main > .clipping-information{
        text-align: left;
        margin-top: 20px;
        background-color: #eeeeee;
        padding: 15px;
        border-radius: 4px;
        color: #333;
        font-size: 14px;
        line-height: 22px;
      }
      .mx-wc-main > .clipping-information a { color: blue; }
      .mx-wc-main > .clipping-information label { display: inline; }

    </style>
  </head>
  <body>
    <div class="mx-wc-main">
      ${elemHtml}
      ${MxWcTemplate.clippingInformation.render(v)}
    </div>
  </body>
</html>`;
  }
}

MxWcTemplate.clippingInformation = {
  render: function(v) {
    if(v.config.saveClippingInformation){
      let tagHtml = t('none');
      if(v.info.tags.length > 0) {
        tagHtml = T.map(v.info.tags, function(tag) {
          return "<code>" + tag + "</code>";
        }).join(", ");
      }
      let categoryHtml = t('none');
      if(v.info.category){
        categoryHtml = v.info.category;
      }
      return `
        <hr />
        <!-- clipping information -->
        <div class="clipping-information">
          <label>${t('original_url')}: <a href="${v.info.link}" target="_blank">${t('access')}</a></label><br />
          <label>${t('created_at')}: ${v.info.created_at}</label><br />
          <label>${t('category')}: ${categoryHtml}</label><br />
          <label>${t('tags')}: ${tagHtml}</label>
        </div>`;
    } else {
      return '';
    }
  }
}

