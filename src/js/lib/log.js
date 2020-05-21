"use strict";

import ENV from '../env.js';

const Log = {};

let logLevel = 'debug';
try {
  logLevel = (window && window.location && window.location.search.indexOf('debug') > 0 && 'debug') || (ENV && ENV.logLevel || 'debug');
} catch(e) {
  logLevel = 'debug';
}

const levels = ["debug", "info", "warn", "error"];
if (!levels.includes(logLevel)) {
  console.warn("Invalid logLevel:", logLevel);
}
const shouldLog = {};

{
  let startLogging = false;
  for (const level of levels) {
    if (logLevel === level) {
      startLogging = true;
    }
    if (startLogging) {
      shouldLog[level] = true;
    }
  }
}

function stub() {}
Log.debug = Log.info = Log.warn = Log.error = stub;

if (shouldLog.debug) { Log.debug = console.debug; }
if (shouldLog.info) { Log.info = console.info; }
if (shouldLog.warn) { Log.warn = console.warn; }
if (shouldLog.error) { Log.error = console.error; }

export default Log;
