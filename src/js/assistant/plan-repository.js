"use strict";

import FuzzyMatcher from './fuzzy-matcher.js';
import ENV          from '../env.js';
import Log          from '../lib/log.js';
import T            from '../lib/tool.js';
import Config       from '../lib/config.js';
import Storage      from '../lib/storage.js';

/**!
 * Storage keys:
 *
 *   assistant.default-tag-status
 *     {String} tagStatus
 *
 *   assistant.global-plan.text
 *     {String} content that written by user.
 *
 *   assistant.global-plan
 *     {Plan} the global plan.
 *
 *   assistant.custom-plan.text
 *     {String} content that written by user.
 *
 *   assistant.custom-plans
 *     {Array} custom plans
 *
 *   assistant.public-plan.subscription-text
 *     {String} subscription urls that write by user.
 *
 *   assistant.public-plan.subscription-urls
 *     {Array} subscription urls
 *
 *   assistant.public-plan.pointers
 *     {Array} [assistant.public-plan.$SUBSCRIPTION-NAME.$VERSION]
 *
 *   assistant.public-plan.$SUBSCRIPTION-NAME.latest
 *     {String} assistant.public-plan.$SUBSCRIPTION-NAME.$VERSION
 *
 *   assistant.public-plan.$SUBSCRIPTION-NAME.$VERSION
 *     {Array} public Plans
 *
 *   assistant.public-plan.$SUBSCRIPTION-NAME.text
 *     {String} subscription text (Plan list)
 *
 */


async function get(url) {
  const globalPlan       = await getGlobalPlan();
  const pagePlan         = await getPagePlan(url);
  const defaultTagStatus = await getDefaultTagStatus();
  return {globalPlan, pagePlan, defaultTagStatus};
}


async function getDefaultTagStatus() {
  return await Storage.get('assistant.default-tag-status', "");
}


// WARNING: the returned page plan may be disabled.
async function getPagePlan(url) {
  const fn = (plan) => {
    return T.any(T.toArray(plan.pattern), (pattern) => {
      return FuzzyMatcher.matchUrl(url, pattern);
    }) && !T.any(T.toArray(plan.excludePattern), (pattern) => {
      return FuzzyMatcher.matchUrl(url, pattern);
    })
  }

  // find from cachedPlans
  const cachedPlans = await getCachedPlans();
  const cachedPlan = cachedPlans.find(fn);
  if (cachedPlan) { return cachedPlan }

  // find from custom plans
  const customPlans = await getCustomPlans();
  const customPlan = customPlans.find(fn);
  if (customPlan) {
    cachedPlans.unshift(customPlan);
    await setCachedPlans(cachedPlans);
    return customPlan;
  }

  // find from publicPlans
  const publicPlanPointers = await getPublicPlanPointers()
  for (let i = 0; i < publicPlanPointers.length; i++) {
    const key = publicPlanPointers[i];
    const publicPlans = await Storage.get(key, []);
    const publicPlan = publicPlans.find(fn);
    if (publicPlan) {
      cachedPlans.unshift(publicPlan);
      await setCachedPlans(cachedPlans);
      return publicPlan;
    }
  }

  return null;
}



const DEFAULT_GLOBAL_PLAN = {name: 'the global plan', disabled: true};
async function getGlobalPlan() {
  return await Storage.get('assistant.global-plan', DEFAULT_GLOBAL_PLAN);
}

async function getCachedPlans() {
  return Storage.session.get('assistant.cachedPlans', []);
}

async function setCachedPlans(plans) {
  return Storage.session.set('assistant.cachedPlans', plans);
}

async function resetCachedPlans() {
  return setCachedPlans([]);
}

async function getCustomPlans() {
  return Storage.get('assistant.custom-plans', []);
}

async function getPublicPlanPointers() {
  return Storage.local.get('assistant.public-plan.pointers', []);
}

async function setPublicPlanPointers(pointers) {
  return Storage.local.set('assistant.public-plan.pointers', pointers);
}

async function getPublicPlanSubscriptions() {
  return Storage.local.get('assistant.public-plan.subscriptions', []);
}

async function setPublicPlanSubscriptions(subscriptions) {
  return Storage.set('assistant.public-plan.subscriptions', subscriptions);
}



async function updatePublicPlans(urls) {
  await resetCachedPlans();
  const now = T.currentTime();
  const newPublicPlanPointers = [];
  const keyPrefix = 'assistant.public-plan';
  const defaultVersion = '20180101';
  const subscriptions = [];
  const result = [];

  const oldSubscriptions = await getPublicPlanSubscriptions();
  const oldPublicPlanPointers = await getPublicPlanPointers();


  for (let i = 0; i < urls.length; i++) {
    try {
      const url = new URL(urls[i]);
      // browser might cache the request.
      url.searchParams.append('t', now.str.intSec);
      Log.debug(url.toString());
      const jsonText = await Global.Fetcher.get(url.toString(), {});
      const subscription = JSON.parse(jsonText);
      const pointerKey = [keyPrefix, subscription.name, 'latest'].join('.');
      let pointer = await Storage.get(pointerKey);
      let currVersion = defaultVersion;
      if (pointer) {
        currVersion = pointer.split('.').pop();
      }

      if (subscription.latestVersion > currVersion) {
        Log.debug(`Start update ${subscription.name} from ${currVersion} to ${subscription.latestVersion}`);
        const text = await Global.Fetcher.get(subscription.updateUrl, {});
        const plans = JSON.parse(text);

        const oldKey = [keyPrefix, subscription.name, currVersion].join('.');
        const newKey = [keyPrefix, subscription.name, subscription.latestVersion].join('.');
        const txtKey = [keyPrefix, subscription.name, 'text'].join('.');

        // update storage
        const needRemoveOldPublicPlans = (oldPublicPlanPointers.indexOf(oldKey) > -1);
        await Storage.set(newKey, plans);
        await Storage.set(pointerKey, newKey);
        if (needRemoveOldPublicPlans) { await Storage.remove(oldKey) }
        await Storage.set(txtKey, text);

        newPublicPlanPointers.push(newKey);
        result.push({ok: true, subscription: subscription, updated: true});
        subscriptions.push(subscription);
      } else {
        newPublicPlanPointers.push(pointer);
        result.push({ok: true, subscription: subscription, upToDate: true});
        subscriptions.push(subscription);
        Log.debug('Public plans up to date', 'name: ', subscription.name, 'version: ', subscription.latestVersion);
      }


    } catch (err) {
      result.push({ok: false, message: err.message});
      const subscription = oldSubscriptions.find((it) => {
        return it.url === urls[i]
      });

      if (subscription) {
        // keep old subscription
        const key = [keyPrefix, subscription.name, subscription.latestVersion].join('.');
        newPublicPlanPointers.push(key);
        subscriptions.push(subscription);
      }
      Log.error(err);
    }
  }


  // delete
  for (let j = 0; j < oldPublicPlanPointers.length; j++) {
    const pointer = oldPublicPlanPointers[j];
    if (newPublicPlanPointers.indexOf(pointer) == -1) {
      const prefix = T.deleteLastPart(pointer); // remove $version
      const pointerKey = [prefix, 'latest'].join('.');
      const txtKey = [prefix, 'text'].join('.');
      await Storage.remove([pointerKey, pointer, txtKey])
      Log.debug("delete", pointerKey, pointer, txtKey);
    }
  }

  await setPublicPlanPointers(newPublicPlanPointers);
  await setPublicPlanSubscriptions(subscriptions);

  return result;
}

async function updateGlobalPlan(planText) {
  try {
    const plan = JSON.parse(planText);
    if (plan.constructor !== Object) {
      throw new Error(`The global plan must be an Object, but we've got ${plan.constructor.name}`);
    }
    await Storage.set('assistant.global-plan', plan);
    await Storage.set('assistant.global-plan.text', planText);
    return {ok: true}
  } catch(err) {
    return {ok: false, message: err.message}
  }
}

async function updateCustomPlans(planText) {
  await resetCachedPlans();
  try {
    const plans = JSON.parse(planText);
    await Storage.set('assistant.custom-plans', plans);
    await Storage.set('assistant.custom-plan.text', planText);
    return {ok: true}
  } catch(err) {
    return {ok: false, message: err.message}
  }
}

/*
 * @param {Object} global
 *   - {Fetcher} Fetcher
 */
let Global = null;
function init(global) {
  Global = global;
  Config.load().then((config) => {
    if (config.autoUpdatePublicPlan) {
      Storage.get('assistant.public-plan.subscription-urls', [])
        .then(updatePublicPlans);
    }
  });
}


// set cache to default
function restart() {
  resetCachedPlans();
}

const PlanRepository = { init, restart, get, updatePublicPlans, updateCustomPlans, updateGlobalPlan, }
export default PlanRepository;
