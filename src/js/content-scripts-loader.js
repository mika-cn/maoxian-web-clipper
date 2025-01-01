import T           from '../js/lib/tool.js';
import ExtApi      from '../js/lib/ext-api.js';
import ExtMsg      from '../js/lib/ext-msg.js';

// Change version if any of ALL_FRAME_SCRIPTS, TOP_FRAME_SCRIPTS or getScripts() changes
const VERSION = '1.0';

// execute on all frames
const ALL_FRAME_SCRIPTS = [
  "/vendor/js/browser-polyfill.js",
  "/vendor/js/css.escape.js",
  "/js/content-frame.js"
];

// execute on the top frame only
const TOP_FRAME_SCRIPTS = [
  "/js/content.js"
]

function getScripts() {
  const matches = ["https://*/*", "http://*/*"];
  const runAt = 'document_idle';
  const world = 'ISOLATED';
  const persistAcrossSessions = false;

  const scripts = [
    {
      id: 'ALL_FRAMES',
      js: ALL_FRAME_SCRIPTS,
      allFrames: true,
      matches,
      runAt,
      world,
      persistAcrossSessions,
    },
    {
      id:  'TOP_FRAME',
      js: TOP_FRAME_SCRIPTS,
      allFrames: false,
      matches,
      runAt,
      world,
      persistAcrossSessions,
    }
  ];

  return scripts;
}

async function register() {
  const scripts = await getRegisteredScripts();
  switch (scripts.length) {
    case 0:
      await doRegister();
      break;
    case 1:
      await unregister(scripts);
      await doRegister();
      break;
    default:
      // already registered, doNothing
      break;
  }
}

async function doRegister() {
  try {
    await ExtApi.registerContentScripts(getScripts());
  } catch(error) {
    console.error(
      "failed to register content scripts:",
      error
    );
  }
}


async function unregister(registeredScripts) {
  try {
    let scripts;
    if (registeredScripts) {
      scripts = registeredScripts
    } else {
      scripts = await getRegisteredScripts();
    }
    const ids = scripts.map((it) => it.id);
    const filter = {ids};
    await ExtApi.unregisterContentScripts(filter);
  } catch(error) {
    console.error(
      "failed to unregister content scripts:",
      error
    );
  }
}

async function getRegisteredScripts() {
  try {
    const filter = {ids: ['ALL_FRAMES', 'TOP_FRAME']};
    return await ExtApi.getRegisteredContentScripts(filter)
  } catch(error) {
    console.error(
      "failed to get registered content scripts: ",
      error
    );
  }
}


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
  const files = isTopFrame ? [...ALL_FRAME_SCRIPTS, ...TOP_FRAME_SCRIPTS] : [...ALL_FRAME_SCRIPTS];
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

export default {
  VERSION,
  register, unregister,
  loadInTab, loadInFrame, errorDetails2Str
};
