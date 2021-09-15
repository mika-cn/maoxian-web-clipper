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

export default MxWcTemplate;
