
import ENV     from '../env.js';
import T       from './tool.js';
import ExtApi  from './ext-api.js';
import Storage from './storage.js';
import Config  from './config.js';
import Link    from './link.js';


async function environment() {
  const osEnv = await ExtApi.getEnvironment()
  return {
    os: osEnv.platformInfo.os,
    arch: osEnv.platformInfo.arch,
    nacl_arch: (osEnv.platformInfo.nacl_arch || ""),
    extensionVersion: ENV.version,
    minNativeAppVersion: ENV.minNativeAppVersion,
    logLevel: ENV.logLevel,
    isChromeExtension: Link.isChrome(),
    isMozExtension: Link.isFirefox()
  };
}

async function storage() {
  const logErr = (e) => { console.log(e) }
  let totalBytes = NaN, clipsBytes = NaN;
  try {totalBytes = await Storage.getTotalBytes() } catch(e) { logErr(e) }
  try {clipsBytes = await Storage.getBytesInUse('clips') } catch(e) { logErr(e) }
  const config = Config.unsort(await Config.load());

  const assistantData = await Storage.local.query(T.prefixFilter('assistant', true));
  const selectionData = await Storage.local.query(T.prefixFilter('selectionStore', true));

  const blobUrlDataFilter = (key) => {
    if (key.match(/^\d+\.blob:/)) {
      return false;
    } else {
      return 'NEXT';
    }
  }

  const miscData = await Storage.local.query(
    T.attributeFilter('config', false),
    T.attributeFilter('clips', false),
    T.attributeFilter('categories', false),
    T.attributeFilter('tags', false),
    T.prefixFilter('assistant', false),
    T.prefixFilter('selectionStore', false),
    T.prefixFilter('failedTasks', false),
    blobUrlDataFilter,
    (key) => { return true }
  );

  const data = await Storage.local.query(
    T.attributeFilter('categories', true),
    T.attributeFilter('clips', true),
    T.attributeFilter('tags', true),
    T.attributeFilter('failedTasks', true)
  );

  const allKeys = await Storage.local.getKeys();

  return {
    totalBytes,
    clipsBytes,
    config,
    assistantData,
    selectionData,
    miscData,
    categories: (data.categories || []),
    clippings: (data.clips || []),
    tags: (data.tags || []),
    failedTasks: (data.failedTasks || []),
    allKeys,
  };
}

export default {environment, storage}
