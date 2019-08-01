;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define('MxWcTemplate', [
      'MxWcI18N',
      'MxWcTool'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CJS
    module.exports = factory(
      require('./translation.js'),
      require('../tool.js')
    );
  } else {
    // browser or other
    root.MxWcTemplate = factory(
      root.MxWcI18N,
      root.MxWcTool
    );
  }
})(this, function(I18N, T, undefined) {
  "use strict";

  const MxWcTemplate = {}

  MxWcTemplate.options = {
    render: function(v) {
      const tpl = '<a data-value="${value}" i18n="${i18nKey}"></a>';
      return v.options.map((it) => {
        const i18nKey = ['option', v.type, it, 'name'].join('.');
        return T.renderTemplate(tpl, {
          value: it,
          i18nKey: i18nKey
        });
      }).join("\n");
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
        }
        @media (min-width: 768px) {
          .mx-wc-main { padding: 15px 15px 80px 15px }
        }
        @media (max-width: 767px) {
          .mx-wc-main { padding: 15px 3px 80px 3px }
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
        let tagHtml = I18N.t('none');
        if(v.info.tags.length > 0) {
          tagHtml = T.map(v.info.tags, function(tag) {
            return "<code>" + tag + "</code>";
          }).join(", ");
        }
        let categoryHtml = I18N.t('none');
        if(v.info.category){
          categoryHtml = v.info.category;
        }
        return `
          <hr />
          <!-- clipping information -->
          <div class="clipping-information">
            <label>${I18N.t('original-url')}: <a href="${v.info.link}" target="_blank" referrerpolicy="no-referrer" rel="noopener noreferrer">${I18N.t('access')}</a></label><br />
            <label>${I18N.t('created-at')}: ${v.info.created_at}</label><br />
            <label>${I18N.t('category')}: ${categoryHtml}</label><br />
            <label>${I18N.t('tags')}: ${tagHtml}</label>
          </div>`;
      } else {
        return '';
      }
    }
  }

  return MxWcTemplate;
});
