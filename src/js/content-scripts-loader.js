import T           from '../js/lib/tool.js';
import ExtApi      from '../js/lib/ext-api.js';
import ExtMsg      from '../js/lib/ext-msg.js';

// scripts that will execute on all frames
const CONTENT_SCRIPTS_A = [
  "/vendor/js/browser-polyfill.js",
  "/vendor/js/css.escape.js",
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
  const errorDetails = [];

  if (frames.length == 0) { return {loadedFrameIds, errorDetails}; }

  for (const frame of frames) {
    try {
      await loadInFrame(tabId, frame.frameId);
      loadedFrameIds.push(frame.frameId);
    } catch(e) {
      // something wrong happened when loading content scripts
      const errorDetail = Object.assign(
        {message: e.message}, frame
      );
      errorDetails.push(errorDetail);
    }
  }

  return {loadedFrameIds, errorDetails}
}

function errorDetails2Str(errorDetails, tab) {
  return errorDetails.map((it) => {
    return [
      `ContentScriptLoadError: ${it.message}`,
      `frameId: ${it.frameId}`,
      `frameUrl: ${it.url}`,
      `parentFrameId: ${it.parentFrameId}`,
      `errorOccurred: ${it.errorOccured}`,
      `tabUrl: ${tab.url}`,
      `tabTitle: ${tab.title}`,
    ].join(", ");
  }).join("\n");
}


async function loadInFrame(tabId, frameId, needPing = false) {
  if (needPing && (await isContentScriptsLoaded(tabId, frameId))) {
    return true;
  }

  const isTopFrame = (frameId == 0);
  const files = isTopFrame ? [...CONTENT_SCRIPTS_A, ...CONTENT_SCRIPTS_B] : [...CONTENT_SCRIPTS_A];
  const target = {tabId, frameIds: [frameId]};

  const [injectionResult] = await ExtApi.executeContentScript({files, target});

  // all content scripts has loaded successfully.
  return true;
}


async function getFramesThatNotLoadContentScriptsYet(tabId) {
  const frames = await ExtApi.getAllFrames(tabId);

  let topFrame;
  const targetFrames = [];
  for (const frame of frames) {
    // Maybe oneday we need to do it
    // on non-http frames too.
    if (T.isHttpUrl(frame.url)
      && !(await isContentScriptsLoaded(tabId, frame.frameId))
    ) {
      if (frame.frameId == 0) {
        topFrame = frame;
      } else {
        targetFrames.push(frame);
      }
    }
  }

  if (topFrame) {
    // put topFrame at the end.
    targetFrames.push(topFrame);
  }
  return targetFrames;
}



async function isContentScriptsLoaded(tabId, frameId) {
  try {
    const resp = await ExtMsg.pingContentScript(tabId, frameId);
    if (resp == 'pong') {
      // the target frame can respond to ping,
      // that means it's content scripts have loaded.
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

export default {loadInTab, loadInFrame, errorDetails2Str};
