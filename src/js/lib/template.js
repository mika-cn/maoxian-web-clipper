"use strict";

import T from './tool.js';

const MxWcTemplate = {}

MxWcTemplate.options = {
  render: function(v) {
    const tpl = '<a data-value="${value}" i18n="${i18nKey}"></a>';
    return v.options.map((it) => {
      const i18nKey = ['g.option-value', it].join('.');
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
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${v.title}</title>
    ${v.headInnerHtml}
  </head>
  ${v.html}
</html>`;
  }
}

MxWcTemplate.customElemPage = {
  render: function(v){
    return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Custom Element Page</title>
    <style>
      html,body {
        padding: 0px !important;
        margin: 0px !important;
      }
    </style>
  </head>
  <body>
  ${v.html}
  <style>html,body { height: 100% !important; }</style>
  </body>
</html>`;
  }
}

// OK
MxWcTemplate.elemPage = {
  render: function(v){
  return `
<!DOCTYPE html>
<html${v.htmlIdAttr}${v.htmlClassAttr}${v.htmlStyleAttr}>
  <!-- OriginalSrc: ${v.info.link} -->
  <head></head>
  <body style="background-color: ${v.bodyBgCss} !important; min-height: 100%; height: auto; position: static !important; overflow: auto !important; padding-bottom: 0px !important;"${v.bodyIdAttr}${v.bodyClassAttr}>
    <div class="mx-wc-main">
      ${v.elemHtml}
      ${MxWcTemplate.clippingInformation.render(v)}
    </div>
  </body>
</html>`;
  }
}


// OK
MxWcTemplate.bodyPage = {
  render: function(v) {
    const infoHtml = MxWcTemplate.clippingInformation.render(v);
    const bodyHtml = T.replaceLastMatch(
      v.elemHtml, /<\/body>/img,
      [infoHtml, "</body>"].join("\n")
    );
    const clippingInfoStyle = MxWcTemplate.clippingInformationStyle.render(v);
    const mxWcStyle = (clippingInfoStyle === '' ? '' : `<style class="mx-wc-style">${clippingInfoStyle}</style>`);
  return `
<!DOCTYPE html>
<html${v.htmlIdAttr}${v.htmlClassAttr}${v.htmlStyleAttr}>
  <!-- OriginalSrc: ${v.info.link} -->
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${v.info.title}</title>
    ${v.headInnerHtml}
    ${mxWcStyle}
  </head>
  ${bodyHtml}
</html>`;
  }
}
export default MxWcTemplate;
