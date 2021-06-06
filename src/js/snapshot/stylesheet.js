
import T      from '../lib/tool.js';
import ExtMsg from '../lib/ext-msg.js';
import CssTextParser from './css-text-parser.js';

const CSSRULE_TYPE = T.defineEnum([
  'UNKNOWN',
  'STYLE',
  'CHARSET',
  'IMPORT',
  'MEDIA',
  'FONT_FACE',
  'PAGE',
  'KEYFRAMES',
  'KEYFRAME',
  'MARGIN',
  'NAMESPACE',
  'COUNTER_STYLE',
  'SUPPORTS',
  'DOCUMENT',
  'FONT_FEATURE_VALUES',
  'VIEWPORT',
  'REGION_STYLE',
], 0);



/*
 * @param {CSSStyleSheet} sheet
 * @param {Object} params
 *   - @param {Array} sheetInfoAncestors
 *   - @param {RequestParams} requestParams
 *   - @param {Window} win
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
  snapshot.mediaList = mediaList2Array(sheet.media);

  const sheetInfo = {accessDenied: false, url: sheet.href}

  if (sheetInfo.url && !sheetInfo.url.match(/^http/i)) {
    // FIXME
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
      && sheetInfoAncestors[sheetInfoAncestors.length - 1].accessDenied) {
      // In this case, calling the cssRules of parent sheet was denied.
      // This sheet is an imported sheet.
      // it's cssRules hasn't fetched yet (@see handleCrossOriginCssText).
      //
      // We should fetch this sheet;
      throw new Error("AccessDenied: Imported sheet hasn't fetched");
    }

  } catch(e) {

    sheetInfo.accessDenied = true;
    console.log("AccessDenied: ", e.message, sheetInfo.url);

    if (sheetInfo.url) {

      try {
        const {result: text} = await ExtMsg.sendToBackground({
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

  // if the text contains @import rule
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
      r.selectorText = rule.selectorText;
      r.styleObj = CssTextParser.parse(rule.style.cssText);
      break;

    case CSSRULE_TYPE.IMPORT:
      r.href = rule.href;
      //r.mediaText = rule.media.mediaText;
      r.mediaList = mediaList2Array(rule.media);
      // when circular, chrome will set sheet to null, but firefox
      // will still has stylesheet property with cssRules an empty list.
      if (!rule.styleSheet) {
        r.circular = true;
        break;
      }
      const newSheetInfoAncestors = [...sheetInfoAncestors, sheetInfo];
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
      r.conditionText = rule.conditionText;
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
      throw new Error("getCssRuleType(): Why constructor.name is undefined");
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

// ownerType: styleNode, linkNode, importRule, fontFaceRule, styleAttr

function sheetToString(sheet, {baseUrl, ownerType, resourceHandler}) {
  return rulesToString(sheet.rules, {baseUrl, ownerType, resourceHandler});
}

function rulesToString(rules = [], {baseUrl, ownerType, resourceHandler}) {
  return rules.map((rule) => ruleToString(rule, {baseUrl, ownerType, resourceHandler})).join("\n");
}

function ruleToString(rule, {baseUrl, ownerType, resourceHandler}) {
  let cssText;
  switch(rule.type) {

    case CSSRULE_TYPE.STYLE:
      cssText = styleObjToString(rule.styleObj, {baseUrl, ownerType, resourceHandler});
      return `${rule.selectorText} {\n${cssText}\n}`;

    case CSSRULE_TYPE.PAGE:
      cssText = styleObjToString(rule.styleObj, {baseUrl, ownerType, resourceHandler});
      return `@page${padIfNotEmpty(rule.selectorText)} {\n${cssText}}`;

    case CSSRULE_TYPE.IMPORT:
      if (rule.circular) {
        return `/*@import url("${rule.href}"); Err: circular stylesheet.*/`;
      }
      if (rule.sheet.rules.length == 0) {
        return `/*@import url("${rule.sheet.href}"); Err: empty stylesheet(maybe 404).*/`;
      }
      cssText = sheetToString(rule.sheet, {baseUrl: rule.sheet.href, ownerType: 'importRule', resourceHandler});
      const resourceType = 'css';
      const path = resourceHandler({ownerType, resourceType, cssText, baseUrl, url: rule.sheet.href});
      return `@import url("${path}")${padIfNotEmpty(rule.mediaText)};`;

    case CSSRULE_TYPE.FONT_FACE:
      cssText = styleObjToString(rule.styleObj, {baseUrl, ownerType: 'fontFaceRule', resourceHandler});
      return `@fontface {\n${cssText}\n}`;
      break;

    case CSSRULE_TYPE.MEDIA:
      cssText = rulesToString(rule.rules, {baseUrl, ownerType, resourceHandler});
      return `@media${padIfNotEmpty(rule.conditionText)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.SUPPORTS:
      cssText = rulesToString(rule.rules, {baseUrl, ownerType, resourceHandler});
      return `@supports${padIfNotEmpty(rule.conditionText)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.NAMESPACE:
      return `@namespace${padIfNotEmpty(rule.prefix)} url(${rule.namespaceURI})}`

    case CSSRULE_TYPE.KEYFRAMES:
      cssText = rulesToString(rule.rules, {baseUrl, ownerType, resourceHandler});
      return `@keyframes${padIfNotEmpty(rule.name)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.KEYFRAME:
      cssText = styleObjToString(rule.styleObj, {baseUrl, ownerType, resourceHandler});
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

const padIfNotEmpty = (str) => str.length > 0 ? ' ' + str : '';



function styleObjToString(styleObj, {baseUrl, ownerType, resourceHandler}) {
  const indent = '  ';
  const items = [
    /* ownerType resourceType propertyName */
    ['_ANY_',        'image', 'background'],
    ['_ANY_',        'image', 'background-image'],
    ['_ANY_',        'image', 'border-image'],
    ['fontFaceRule', 'font' , 'src'],
  ];

  const change = {};
  items.forEach((it) => {
    const propertyValue = styleObj[it[2]];
    if (propertyValue && (it[0] === '_ANY_' || it[0] === ownerType)) {
      change[it[2]] = parsePropertyValue(propertyValue, {
        resourceType: it[1], baseUrl, ownerType, resourceHandler});
    }
  });

  return T.mapObj(styleObj, (k, v) => `${indent}${k}: ${change[k] || v};`).join("\n");
}

const URL_RE_A = /url\("([^\)]+)"\)/i;
const URL_RE_B = /url\('([^\)]+)'\)/i;
const URL_RE_C = /url\(([^\)'"]+)\)/i;
const URL_RES = [URL_RE_A, URL_RE_B, URL_RE_C];

function parsePropertyValue(value, {resourceType, baseUrl, ownerType, resourceHandler}) {
  let txt = value;
  let matched = false;
  for (let i = 0; i < URL_RES.length; i++) {
    if (matched) { return txt }
    txt = txt.replace(URL_RES[i], (match) => {
      matched = true;
      const path = resourceHandler({ownerType, resourceType, baseUrl, url: match[1]});
      return `url("${path}")`;
    });
  }
  return txt;
}

export default {
  take: handleStyleSheet,
  toString: sheetToString,
  styleObjToString: styleObjToString,
};
