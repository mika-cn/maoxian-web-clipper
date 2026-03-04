import ExtApi  from '../lib/ext-api.js';

// Static rules are packaged, installed, and updated when an extension is installed or upgraded
// @see json/cache-rules.json

// @mdn/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest/Rule
// @mdn/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest/RuleCondition
// @mdn/en-US/docs/Mozilla/Add-ons/WebExtensions/API/declarativeNetRequest/RuleAction

// If we could utilize web page cache in background
// So that these asset rquest can be cached use DNR
//
// Then use this module to cache assets.
//
//
//  manifest.permissions
//    "declarativeNetRequestWithHostAccess",
//    "declarativeNetRequestFeedback",
//
//  "declarative_net_request": {
//    "rule_resources": [{
//      "enabled": false,
//      "id": "ruleset_cache",
//      "path": "json/cache-rules.json"
//    }]
//  },
//

const RULE_SET_ID   = 'ruleset_cache';
const RULE_ID_CSS   = 11;
const RULE_ID_IMAGE = 22;
const RULE_ID_FONT  = 33;

function getSwitchStatus(config) {
  const arr = [];
  const items = [
    [config.requestCacheCss     , 'css'],
    [config.requestCacheImage   , 'image'],
    [config.requestCacheWebFont , 'font'],
  ];

  items.forEach(([cacheEnabled, value]) => {
    if (cacheEnabled) { arr.push(value) }
  });
  return arr.join(',');
}

async function updateRules(config) {
  const disableRuleIds = [];
  const enableRuleIds = [];
  const items = [
    [config.requestCacheCss     , RULE_ID_CSS],
    [config.requestCacheImage   , RULE_ID_IMAGE],
    [config.requestCacheWebFont , RULE_ID_FONT],
  ];

  items.forEach(([cacheEnabled, ruleId]) => {
    if (cacheEnabled) {
      enableRuleIds.push(ruleId);
    } else {
      disableRuleIds.push(ruleId);
    }
  });

  const options = {
    rulesetId: RULE_SET_ID,
    enableRuleIds,
    disableRuleIds,
  }

  return ExtApi.updateDnrStaticRules(options);
}

export default {getSwitchStatus, updateRules};
