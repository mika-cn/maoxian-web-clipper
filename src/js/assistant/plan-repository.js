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
 *     {Array} [assistant.public-plan.$SUBSCRIPTION-$NAME.$VERSION]
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

const state = {
  cachedPlans: [],
  customPlans: null,
  publicPlanPointers: [],
  publicPlanDict: {},
};

function initPublicPlanPointers() {
  Storage.get('assistant.public-plan.pointers').then((pointers) => {
    if(pointers) { state.publicPlanPointers = pointers }
  });
}

async function get(url) {
  const fn = (plan) => FuzzyMatcher.matchUrl(url, plan.pattern);

  // find from cachedPlans
  const cachedPlan = state.cachedPlans.find(fn);
  if (cachedPlan) { return cachedPlan }

  // find from customPlans
  if (state.customPlans === null) {
    state.customPlans = await Storage.get('assistant.custom-plans', []);
  }
  const customPlan = state.customPlans.find(fn);
  if (customPlan) {
    state.cachedPlans.unshift(customPlan);
    return customPlan;
  }

  // find from publicPlans
  for (let i = 0; i < state.publicPlanPointers.length; i++) {
    const key = state.publicPlanPointers[i];
    if (typeof state.publicPlanDict[key] === 'undefined') {
      state.publicPlanDict[key] = await Storage.get(key, []);
    }
    const plan = state.publicPlanDict[key].find(fn);
    if (plan) {
      state.cachedPlans.unshift(plan);
      return plan;
    }
  }

  return null;
}



async function updatePublicPlans(urls) {
  state.cachedPlans = [];
  const now = T.currentTime();
  const newPublicPlanPointers = [];
  const keyPrefix = 'assistant.public-plan';
  const defaultVersion = '20180101';
  const subscriptions = [];
  const result = [];
  const oldSubscriptions = await Storage.get([keyPrefix, 'subscriptions'].join('.'));

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

        state.publicPlanDict[newKey] = plans;
        const idx = state.publicPlanPointers.indexOf(oldKey);
        if (idx > -1) {
          // update current state
          state.publicPlanPointers[idx] = newKey;
          delete state.publicPlanDict[oldKey];

          // update storage
          await Storage.set(newKey, plans);
          await Storage.set(pointerKey, newKey);
          await Storage.remove(oldKey);
          await Storage.set(txtKey, text);
        } else {
          await Storage.set(newKey, plans);
          await Storage.set(pointerKey, newKey);
          await Storage.set(txtKey, text);
        }

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
  for (let j = 0; j < state.publicPlanPointers.length; j++) {
    const pointer = state.publicPlanPointers[j];
    if (newPublicPlanPointers.indexOf(pointer) == -1) {
      delete state.publicPlanDict[pointer];
      const prefix = T.deleteLastPart(pointer);
      const pointerKey = [prefix, 'latest'].join('.');
      const txtKey = [prefix, 'text'].join('.');
      await Storage.remove([pointerKey, pointer, txtKey])
      Log.debug("delete", pointerKey, pointer, txtKey);
    }
  }

  await Storage.set([keyPrefix, 'pointers'].join('.'), newPublicPlanPointers);
  await Storage.set([keyPrefix, 'subscriptions'].join('.'), subscriptions);
  state.publicPlanPointers = newPublicPlanPointers;
  return result;
}

async function updateCustomPlans(planText) {
  state.cachedPlans = [];
  try {
    const plans = JSON.parse(planText);
    state.customPlans = plans;
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
  initPublicPlanPointers();
  Config.load().then((config) => {
    if (config.autoUpdatePublicPlan) {
      Storage.get('assistant.public-plan.subscription-urls', [])
        .then((urls) => {
          updatePublicPlans(urls);
        });
    }
  });
}


// set state to default
function restart() {
  state.cachedPlans = [];
  state.customPlans = null;
  state.publicPlanPointers = [];
  state.publicPlanDict = {};
  initPublicPlanPointers();
}

const PlanRepository = { init, restart, get, updatePublicPlans, updateCustomPlans }
export default PlanRepository;
