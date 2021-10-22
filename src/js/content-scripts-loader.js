import T           from '../js/lib/tool.js';
import ExtApi      from '../js/lib/ext-api.js';
import ExtMsg      from '../js/lib/ext-msg.js';

// scripts that will execute on all frames
const CONTENT_SCRIPTS_A = [
  "/vendor/js/browser-polyfill.js",
  "/vendor/js/i18n.js",
  "/_locales/en/common.js",
  "/_locales/zh_CN/common.js",
  "/js/content-frame.js"
];

// scripts thet will only execute on the top frame.
const CONTENT_SCRIPTS_B = [
  "/js/content.js"
]


/**
 * load content scripts to tab
 *
 * return a promise that will resolve with loaded frame ids.
 *
 */
async function loadInTab(tabId) {
  const frames = await getFramesThatNotLoadContentScriptsYet(tabId);
  const loadedFrameIds = [];
  if (frames.length == 0) { return loadedFrameIds; }

  const tasks = [];
  for (const {frameId} of frames) {
    tasks.push(new Promise(async (resolve, reject) => {
      try {
        await loadInFrame(tabId, frameId);
        resolve(frameId);
      } catch(e) {
        // something wrong happened when loading content scripts
        reject(e.message);
      }
    }));
  }

  return await Promise.all(tasks);
}


async function loadInFrame(tabId, frameId, needPing = false) {
  if (needPing && (await isContentScriptsLoaded(tabId, frameId))) {
    return true;
  }

  for (const file of CONTENT_SCRIPTS_A) {
    await ExtApi.executeContentScript(tabId, {
      frameId, file, runAt: 'document_idle'});
  }
  if (frameId == 0) {
    // top frame
    for (const file of CONTENT_SCRIPTS_B) {
      await ExtApi.executeContentScript(tabId, {
        frameId, file, runAt: 'document_idle'});
    }
  }
  // all content scripts has loaded successfully.
  return true;
}


async function getFramesThatNotLoadContentScriptsYet(tabId) {
  const frames = await ExtApi.getAllFrames(tabId);
  const targetFrames = [];
  for (const frame of frames) {
    if (T.isHttpUrl(frame.url)
      && !(await isContentScriptsLoaded(tabId, frame.frameId))
    ) {
      targetFrames.push(frame);
    }
  }
  return targetFrames;
}



async function isContentScriptsLoaded(tabId, frameId) {
  try {
    const resp = await ExtMsg.pingContentScript(tabId, frameId);
    if (resp == 'pong') {
      // the target frame can respond to ping,
      // that means it's content scripts have laoded.
      return true;
    } else {
      // In some old version of firefox (such as: 60.8.0esr)
      // when you send the same message to content script the second time,
      // it'll resolve undefined and the actual message won't be sent.
      return false;
    }
  } catch (e) {
    // failed to connect to content script,
    // they haven't loaded yet.
    return false;
  }
}

export default {loadInTab, loadInFrame};
