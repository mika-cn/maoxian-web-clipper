import T      from '../lib/tool.js';
import ExtApi from '../lib/ext-api.js';
import ExtMsg from '../lib/ext-msg.js';

// This library is intended to port service worker only.
//
// We can't use URL.createObjectURL in service worker :(

const DOC_PATH = '/pages/off-screen.html';

async function create(blob) {
  if (URL.createObjectURL) {
    return URL.createObjectURL(blob)
  } else {
    return await createThroughOffscreenDoc(blob);
  }
}

async function revoke(blobUrl) {
  if (URL.revokeObjectURL) {
    return URL.revokeObjectURL(blobUrl);
  } else {
    return revokeThroughOffscreenDoc(blobUrl);
  }
}

async function createThroughOffscreenDoc(blob) {
  await setupOffscreenDocument(DOC_PATH);
  const base64Str = await T.blobToBase64Str(blob)
  const message = {
    type: 'create-object-url',
    body: {base64Str, mimeType: blob.type}
  };
  return sendMessageToOffScreen(message);
}


async function revokeThroughOffscreenDoc(blobUrl) {
  await setupOffscreenDocument(DOC_PATH);
  const message = {type: 'revoke-object-url', body: {blobUrl}};
  sendMessageToOffScreen(message);
}

function sendMessageToOffScreen(message) {
  const target = 'off-screen';
  return ExtMsg.sendToExtPage(target, message);
}


// @see https://developer.chrome.com/docs/extensions/reference/offscreen.html

let creating; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path) {
  // Check all windows controlled by the service worker to see if one
  // of them is the offscreen document with the given path
  const offscreenUrl = ExtApi.getURL(path);
  const existingContexts = await ExtApi.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  // create offscreen document
  if (creating) {
    await creating;
  } else {
    creating = ExtApi.createOffscreenDoc({
      url: path,
      reasons: ['BLOBS'],
      justification: 'Need to use URL.createObjectURL to download big blob objects',
    });
    await creating;
    creating = null;
  }
}

export default {create, revoke}
