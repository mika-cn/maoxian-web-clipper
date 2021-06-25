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
async function sheetToString(sheet, params) {
  return await rulesToString(sheet.rules, params);
}

async function rulesToString(rules = [], params) {
  const r = [];
  for (const rule of rules) {
    r.push(await ruleToString(rule, params));
  }
  return r.join("\n");
}

async function ruleToString(rule, params) {
  let cssText;
  switch(rule.type) {

    case CSSRULE_TYPE.STYLE:
      cssText = await styleObjToString(rule.styleObj, params);
      return `${rule.selectorText} {\n${cssText}\n}`;

    case CSSRULE_TYPE.PAGE:
      cssText = await styleObjToString(rule.styleObj, params);
      return `@page${padIfNotEmpty(rule.selectorText)} {\n${cssText}}`;

    case CSSRULE_TYPE.IMPORT:
      if (rule.circular) {
        return `/*@import url("${rule.href}"); Error: circular stylesheet.*/`;
      }

      if (!rule.sheet || rule.sheet.rules.length == 0) {
        return `/*@import url("${rule.sheet.href}"); Error: empty stylesheet(maybe 404).*/`;
      }

      const newOwnerType = 'importRule';
      cssText = await sheetToString(rule.sheet, {
        baseUrl: rule.sheet.href,
        ownerType: newOwnerType,
        resourceHandler: params.resourceHandler
      });

      const resourceType = 'css';
      const path = await resourceHandler({
        url: rule.sheet.href,
        ownerType: newOwnerType,
        resourceType, cssText, baseUrl,
      });
      return `@import url("${path}")${padIfNotEmpty(rule.mediaText)};`;

    case CSSRULE_TYPE.FONT_FACE:
      cssText = await styleObjToString(rule.styleObj, {
        baseUrl: params.baseUrl,
        ownerType: 'fontFaceRule',
        resourceHandler: params.resourceHandler,
      });
      return `@fontface {\n${cssText}\n}`;
      break;

    case CSSRULE_TYPE.MEDIA:
      cssText = await rulesToString(rule.rules, params);
      return `@media${padIfNotEmpty(rule.conditionText)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.SUPPORTS:
      cssText = await rulesToString(rule.rules, params);
      return `@supports${padIfNotEmpty(rule.conditionText)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.NAMESPACE:
      return `@namespace${padIfNotEmpty(rule.prefix)} url(${rule.namespaceURI})}`

    case CSSRULE_TYPE.KEYFRAMES:
      cssText = await rulesToString(rule.rules, params);
      return `@keyframes${padIfNotEmpty(rule.name)} {\n${cssText}\n}`;

    case CSSRULE_TYPE.KEYFRAME:
      cssText = await styleObjToString(rule.styleObj, params);
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



async function styleObjToString(styleObj, {baseUrl, ownerType, resourceHandler}) {
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


  return T.mapObj(styleObj, (k, v) => `${indent}${k}: ${change[k] || v};`).join("\n");
}

const URL_RE_A = /url\("([^\)]+)"\)/i;
const URL_RE_B = /url\('([^\)]+)'\)/i;
const URL_RE_C = /url\(([^\)'"]+)\)/i;
const URL_RES = [URL_RE_A, URL_RE_B, URL_RE_C];

async function parsePropertyValue(value, {resourceType, baseUrl, ownerType, resourceHandler}) {
  let txt = value;
  let matched = false;
  for (let i = 0; i < URL_RES.length; i++) {
    if (matched) { return txt }
    const marker = T.createMarker();
    const resourceInfos = [];

    txt = txt.replace(URL_RES[i], (match, path) => {
      matched = true;
      const {isValid, url, message} = T.completeUrl(path, baseUrl);

      if (!isValid) {
        const err = [message, `path: ${path}`].join(' ');
        //TODO add error message
        return 'url("")';
      }

      if(T.isDataUrl(url) || T.isHttpUrl(url)) {
        resourceInfos.push({ownerType, resourceType, baseUrl, url});
        return `url("${marker.next()}")`;
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

export default {sheetToString, styleObjToString};
