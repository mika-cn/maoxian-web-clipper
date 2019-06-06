
const MxWcTemplate = {}

MxWcTemplate.UIHtml = {
  render: function(v){
    return `
<div class="${v.g} MX-wc-bar idle">
  <label class="${v.g} ${v.c.hint}">-</label><label class="${v.g}" id="${v.id.btn}" ></label>
</div>
<div class="${v.g} MX-wc-help">
  <div class="help-group">
    <table>
      <tr>
        <td class="intro">${t('hotkey.enter.intro')}</td>
        <td class="normal">
          <kbd data-key-code="13">Enter</kbd>
        </td>
      </tr>
      <tr>
        <td class="intro">${t('hotkey.delete.intro')}</td>
        <td class="normal">
          <kbd data-key-code="46">Delete</kbd>
        </td>
      </tr>
      <tr>
        <td class="intro">${t('hotkey.esc.intro')}</td>
        <td class="normal">
          <kbd data-key-code="27">Esc</kbd>
        </td>
      </tr>
      <tr>
        <td class="intro">${t('hotkey.scroll.intro')}</td>
        <td class="normal">
          <kbd data-key-code="-1001">${t('hotkey.scroll.name')}</kbd>
        </td>
      </tr>
    </table>
  </div>
  <div class="help-group">
    <table>
      <tr>
        <td class="intro">${t('hotkey.left.intro')}</td>
        <td class="arrow">
          <kbd data-key-code="37">←</kbd>
        </td>
      </tr>
      <tr>
        <td class="intro">${t('hotkey.right.intro')}</td>
        <td class="arrow">
          <kbd data-key-code="39">→</kbd>
        </td>
      </tr>
      <tr>
        <td class="intro">${t('hotkey.up.intro')}</td>
        <td class="arrow">
          <kbd data-key-code="38">↑</kbd>
        </td>
      </tr>
      <tr>
        <td class="intro">${t('hotkey.down.intro')}</td>
        <td class="arrow">
          <kbd data-key-code="40">↓</kbd>
        </td>
      </tr>
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
    <style class="mx-wc-style">
      .mx-wc-main img {max-width: 100%;}
      .mx-wc-main{
        box-sizing: content-box;
        background-color: ${v.outerElemBgCss} !important;
        margin: 0 auto;
        max-width: ${v.elemWidth}px;
        padding: 15px 15px 80px 15px;
      }
${MxWcTemplate.clippingInformationStyle}
    </style>
  </head>
  <body style="background-color: ${v.bodyBgCss} !important; min-height: 100%; height: auto;" id="${v.bodyId}" class="${v.bodyClass}">
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
    const infoHtml = MxWcTemplate.clippingInformation.render(v);
    const bodyHtml = v.elemHtml.replace(/<\/body>/i, [infoHtml, "</body>"].join("\n"));
  return `
<!DOCTYPE html>
<html>
  <!-- OriginalSrc: ${v.info.link} -->
  <head>
    <meta http-equiv="Content-Type" content="text/html"; charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${v.info.title}</title>
    ${v.styleHtml}
    <style class="mx-wc-style">
${MxWcTemplate.clippingInformationStyle}
    </style>
  </head>
  ${bodyHtml}
</html>`;
  }
}
MxWcTemplate.clippingInformationStyle = `
      .clipping-information{
        text-align: left;
        margin-top: 20px;
        background-color: #eeeeee !important;
        padding: 15px;
        border-radius: 4px;
        color: #333;
        font-size: 14px !important;
        line-height: 22px !important;
      }
      .clipping-information a {
        color: blue !important;
        text-decoration: underline !important;
      }
      .clipping-information label {
        display: inline;
        text-transform: none;
      }
      .clipping-information label > code {
        padding: 2px 8px;
        background-color: rgba(200, 200, 200, 0.7)!important;
        font-size: 14px;
      }
`;

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
          <label>${t('original_url')}: <a href="${v.info.link}" target="_blank" referrerpolicy="no-referrer" rel="noopener noreferrer">${t('access')}</a></label><br />
          <label>${t('created_at')}: ${v.info.created_at}</label><br />
          <label>${t('category')}: ${categoryHtml}</label><br />
          <label>${t('tags')}: ${tagHtml}</label>
        </div>`;
    } else {
      return '';
    }
  }
}
