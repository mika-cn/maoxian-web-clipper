
import T      from '../lib/tool.js';
import ExtMsg from '../lib/ext-msg.js';
import {CSSRULE_TYPE} from '../lib/constants.js';
import CssTextParser from './css-text-parser.js';

/**!
 * There are some rules that generage by javascript (using CSSOM)
 * These rules are weired, you can find them in devTool as inline style,
 * but you can't find them in the html source...
 *
 * We use CSSOM to collect styles, but we lost some
 * browser specific css declarations at the same time.
 * Browsers will ignore other browsers' prefix,
 * for example, Firefox will ignore "--webkit-*".
 *
 */



/*
 * @param {CSSStyleSheet} sheet
 * @param {Object} params
 *   - @param {Array} sheetInfoAncestors
 *   - @param {RequestParams} requestParams
 *   - @param {Window} win
 *
 * @return {Snapshot} it
 */
async function handleStyleSheet(sheet, params) {

  const {sheetInfoAncestors = [], requestParams, win} = params;

  if (sheetInfoAncestors.length > 10) {
    console.error("handleStyleSheet() dead loop: ", sheetInfoAncestors);
    return null;
  }

  if (sheet.type !== 'text/css') {
    return null;
  }

  const snapshot = T.sliceObj(sheet, ['href', 'disabled', 'title']);
  try {
    snapshot.mediaText = sheet.media.mediaText;
    snapshot.mediaList = mediaList2Array(sheet.media);
  } catch(e) {
    // permission denied to access property "mediaText"
    // @ https://bugzilla.mozilla.org/show_bug.cgi?id=1673199
    snapshot.mediaText = 'all';
    snapshot.mediaList = ['all'];
  }


  const sheetInfo = {accessDenied: false, url: sheet.href, rules: []}

  if (sheetInfo.url && !sheetInfo.url.match(/^http/i)) {
    // not starts with http (about:blank, about:invalid etc.)
    return snapshot;
  }

  try {
    // @see MDN/en-US/docs/Web/API/CSSStyleSheet
    // Calling cssRules may throw SecurityError (when crossOrigin)
    snapshot.rules = await handleCssRules(sheet.cssRules,
      {sheetInfo, sheetInfoAncestors, requestParams, win});


    if (snapshot.rules.length == 0
      && sheetInfoAncestors.length > 0
      && sheetInfoAncestors[0].accessDenied) {
      // In this case, calling the cssRules of parent sheet was denied.
      // This sheet is an imported sheet.
      // it's cssRules hasn't fetched yet (@see handleRulesByParsingCssText).
      //
      // We should fetch this sheet;
      throw new Error("AccessDenied: Imported sheet hasn't fetched");
    }

  } catch(e) {

    sheetInfo.accessDenied = true;
    console.log("AccessDenied: ", e.message, sheetInfo.url);

    if (sheetInfo.url) {

      try {
        const {result: text} = await ExtMsg.sendToBackend('clipping', {
          type: 'fetch.text',
          body: requestParams.toParams(sheetInfo.url),
        });
        snapshot.rules = await handleRulesByParsingCssText(text,
          {sheetInfo, sheetInfoAncestors, requestParams, win});
      } catch(e) {
        console.error("fetch.text(css): ", e);
        snapshot.rules = [];
      }

    } else {
      // Shouldn't reach here!
      snapshot.rules = [];
    }
  }
  return snapshot;
}



async function handleRulesByParsingCssText(text, params) {
  const {sheetInfo, win} = params;

  const doc = win.document.implementation.createHTMLDocument("");
  const base = doc.createElement('base');
  const style = doc.createElement('style');

  base.href = sheetInfo.url;
  style.textContent = text;

  doc.head.appendChild(base);
  doc.head.appendChild(style);

  // if the text contains an @import rule
  //
  // On firefox:
  //   the imported style has empty cssRules,
  //   it seems the browser won't
  //   fetch the imported styleSheet.
  //
  // On Chromium:
  //   you can't access cssRules of imported
  //   style.
  //

  return await handleCssRules(style.sheet.cssRules, params);
}



async function handleCssRules(rules, params) {
  const r = [];
  for (const rule of rules) {
    r.push(await handleCssRule(rule, params));
  }
  return r;
}



async function handleCssRule(rule, params) {

  const {sheetInfo, sheetInfoAncestors, requestParams, win} = params;

  const ruleType = getCssRuleType(rule);
  const r = {type: ruleType};

  switch(ruleType) {

    case CSSRULE_TYPE.STYLE:
    case CSSRULE_TYPE.PAGE:
      r.selectorText = (rule.selectorText || "");
      r.styleObj = CssTextParser.parse(rule.style.cssText);
      break;

    case CSSRULE_TYPE.IMPORT:
      r.href = rule.href;
      try {
        r.mediaText = rule.media.mediaText;
        r.mediaList = mediaList2Array(rule.media);
      } catch(e) {
        r.mediaText = 'all';
        r.mediaList = ['all'];
      }
      // when circular, chrome will set sheet to null, but firefox
      // will still has stylesheet property with cssRules an empty list.
      if (!rule.styleSheet) {
        r.circular = true;
        break;
      }
      const newSheetInfoAncestors = [sheetInfo, ...sheetInfoAncestors];
      if (isCircularSheet(rule.styleSheet, newSheetInfoAncestors)) {
        r.circular = true;
      } else {
        r.sheet = await handleStyleSheet(rule.styleSheet, {
          sheetInfoAncestors: newSheetInfoAncestors,
          requestParams,
          win
        });
      }
      break;

    case CSSRULE_TYPE.FONT_FACE:
      r.styleObj = CssTextParser.parse(rule.style.cssText);
      break;

    case CSSRULE_TYPE.MEDIA:
    case CSSRULE_TYPE.SUPPORTS:
      r.conditionText = (rule.conditionText || "");
      r.rules = await handleCssRules(rule.cssRules, params);
      break;

    case CSSRULE_TYPE.NAMESPACE:
      r.namespaceURI = rule.namespaceURI;
      r.prefix = rule.prefix;
      break;

    case CSSRULE_TYPE.KEYFRAMES:
      r.name = rule.name;
      r.rules = await handleCssRules(rule.cssRules, params);
      break;

    case CSSRULE_TYPE.KEYFRAME:
      r.text = rule.cssText;
      r.keyText = rule.keyText;
      r.styleObj = CssTextParser.parse(rule.style.cssText);
      break;

    case CSSRULE_TYPE.MARGIN:
      r.name = rule.name;
      r.styleObj = CssTextParser.parse(rule.style.cssText);

    default:
      r.text = rule.cssText;
      break;
  }
  return r;
}

function getCssRuleType(rule) {
  if (rule.type && typeof rule.type === 'number') {
    return rule.type;
  } else {
    const name = rule.constructor.name;
    if (name) {
      switch(name) {
        case 'CSSStyleRule'             : return CSSRULE_TYPE.STYLE;
        case 'CSSCharsetRule'           : return CSSRULE_TYPE.CHARSET;
        case 'CSSImportRule'            : return CSSRULE_TYPE.IMPORT;
        case 'CSSMediaRule'             : return CSSRULE_TYPE.MEDIA;
        case 'CSSFontFaceRule'          : return CSSRULE_TYPE.FONT_FACE;
        case 'CSSPageRule'              : return CSSRULE_TYPE.PAGE;
        case 'CSSKeyframesRule'         : return CSSRULE_TYPE.KEYFRAMES;
        case 'CSSKeyframeRule'          : return CSSRULE_TYPE.KEYFRAME;
        case 'CSSMarginRule'            : return CSSRULE_TYPE.MARGIN;
        case 'CSSNamespaceRule'         : return CSSRULE_TYPE.NAMESPACE;
        case 'CSSCounterStyleRule'      : return CSSRULE_TYPE.COUNTER_STYLE;
        case 'CSSSupportsRule'          : return CSSRULE_TYPE.SUPPORTS;
        case 'CSSFontFeatureValuesRule' : return CSSRULE_TYPE.FONT_FEATURE_VALUES;
        case 'CSSViewportRule'          : return CSSRULE_TYPE.VIEWPORT;
        default:
          return CSSRULE_TYPE.UNKNOWN;
      }
    } else {
      //FIXME
      throw new Error("getCssRuleType(): Why constructor.name is undefined in content script");
    }
  }
}

function isCircularSheet(sheet, sheetInfoAncestors) {
  return sheetInfoAncestors.find((it) => it.url && it.url == sheet.href);
}

function mediaList2Array(mediaList) {
  const r = [];
  for (let i = 0; i < mediaList.length; i++) {
    r.push(mediaList[i]);
  }
  return r;
}

// ============================================
// serialization
// ============================================
//
// ownerType:

/*
 * @param {Object} params
 * - {String} baseUrl
 * - {String} ownerType (styleNode, linkNode, importRule, fontFaceRule, styleAttr)
 * - {Function} resourceHandler
 */
async function sheet2String(sheet, params) {
  return await rules2String(sheet.rules, params);
}

async function rules2String(rules = [], params) {
  const r = [];
  for (const rule of rules) {
    r.push(await rule2String(rule, params));
  }
  return r.join("\n");
}

async function rule2String(rule, params) {
  const {resourceHandler, baseUrl} = params;
  let cssText;
  switch(rule.type) {

    case CSSRULE_TYPE.STYLE:
      cssText = await styleObj2String(rule.styleObj, params);
      return `${rule.selectorText} {\n${cssText}\n}`;

    case CSSRULE_TYPE.PAGE:
      cssText = await styleObj2String(rule.styleObj, params);
      return `@page${padIfNotEmpty(rule.selectorText)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.IMPORT:
      if (rule.circular) {
        return `/*@import url("${rule.href}"); Error: circular stylesheet.*/`;
      }

      if (!rule.sheet || rule.sheet.rules.length == 0) {
        return `/*@import url("${rule.sheet.href}"); Error: empty stylesheet(maybe 404).*/`;
      }

      const newOwnerType = 'importRule';
      cssText = await sheet2String(rule.sheet, {
        baseUrl: rule.sheet.href,
        ownerType: newOwnerType,
        resourceHandler: resourceHandler
      });

      const resourceType = 'css';
      const path = await resourceHandler({
        url: rule.sheet.href,
        ownerType: newOwnerType,
        baseUrl: params.baseUrl,
        resourceType, cssText,
      });
      return `@import url("${path}")${padIfNotEmpty(rule.mediaText)};`;

    case CSSRULE_TYPE.FONT_FACE:
      cssText = await styleObj2String(rule.styleObj, {
        ownerType: 'fontFaceRule',
        resourceHandler,
        baseUrl,
      });
      return `@fontface {\n${cssText}\n}`;
      break;

    case CSSRULE_TYPE.MEDIA:
      cssText = await rules2String(rule.rules, params);
      return `@media${padIfNotEmpty(rule.conditionText)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.SUPPORTS:
      cssText = await rules2String(rule.rules, params);
      return `@supports${padIfNotEmpty(rule.conditionText)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.NAMESPACE:
      return `@namespace${padIfNotEmpty(rule.prefix)} url(${rule.namespaceURI})}`

    case CSSRULE_TYPE.KEYFRAMES:
      cssText = await rules2String(rule.rules, params);
      return `@keyframes${padIfNotEmpty(rule.name)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.KEYFRAME:
      cssText = await styleObj2String(rule.styleObj, params);
      return `${rule.keyText} {\n${cssText}\n}`;
      break;

    case CSSRULE_TYPE.MARGIN:
        /*
      r.name = rule.name;
      r.styleObj = CssTextParser.parse(rule.style.cssText);
      */
        //FIXME
      return "";
      break;

    default:
        //FIXME
      //r.text = rule.cssText;
      return "";
      break;
  }
}

const padIfNotEmpty = (str) => str && str.length > 0 ? ' ' + str : '';



async function styleObj2String(styleObj, {baseUrl, ownerType, resourceHandler, renderIndent = true}) {
  const indent = '  ';
  const items = [
    /* ownerType resourceType propertyName */
    ['_ANY_',        'image', 'background'],
    ['_ANY_',        'image', 'background-image'],
    ['_ANY_',        'image', 'border-image'],
    ['fontFaceRule', 'font' , 'src'],
  ];

  const change = {};
  for (const it of items) {
    const propertyValue = styleObj[it[2]];
    if (propertyValue && (it[0] === '_ANY_' || it[0] === ownerType)) {
      change[it[2]] = await parsePropertyValue(propertyValue, {
        resourceType: it[1], baseUrl, ownerType, resourceHandler});
    }
  };

  if (renderIndent) {
    return T.mapObj(styleObj, (k, v) => `${indent}${k}: ${change[k] || v};`).join("\n");
  } else {
    return T.mapObj(styleObj, (k, v) => `${k}: ${change[k] || v}`).join(";");
  }
}



// WARNING: Do NOT change the order, dangerous.

// (?:[^']|(?:\\'))+ matches:
//   - Any characters that is not "'"
//   - Those escapted "'" (preceded by "\")

const URL_RE_A = /url\(\s*'((?:[^']|(?:\\'))+)'\s*\)/img
const URL_RE_B = /url\(\s*"((?:[^"]|(?:\\"))+)"\s*\)/img
const URL_RE_C = /url\(\s*((?:[^'"]|(?:\\")|(?:\\'))+)\s*\)/img

const URL_RES = [URL_RE_A, URL_RE_B, URL_RE_C];

async function parsePropertyValue(value, {resourceType, baseUrl, ownerType, resourceHandler}) {
  let txt = value;
  for (let i = 0; i < URL_RES.length; i++) {
    const marker = T.createMarker();
    const resourceInfos = [];

    txt = txt.replace(URL_RES[i], (match, path) => {
      const {isValid, url, message} = T.completeUrl(path, baseUrl);

      if (!isValid) {
        const err = [message, `path: ${path}`].join(' ');
        //TODO add error message
        return "url('')";
      }

      if(T.isDataUrl(url) || T.isHttpUrl(url)) {
        resourceInfos.push({ownerType, resourceType, baseUrl, url});
        return `url('${marker.next()}')`;
      } else {
        return match;
      }
    });

    if (resourceInfos.length > 0) {

      const paths = [];
      for (const resourceInfo of resourceInfos) {
        const path = await resourceHandler(resourceInfo);
        paths.push(path);
      }

      txt = marker.replaceBack(txt, paths);
    }
  }
  return txt;
}


export default {
  take: handleStyleSheet,
  sheet2String,
  styleObj2String
};
