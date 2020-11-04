"use strict";

import T from './tool.js';

/*
* Task:
* saving task of resource (html, css, font, img, md...)
*
* structure:
* {
*   taskType : 'mainFileTask', 'imageFileTask' etc.
*   type     : resource content type, 'url' or 'text'
*   filename : filename to save
*   url      : resource's url (if type is 'url')
*   mimeType : resource's mimeType (if type is 'text')
*   text     : resource's content (if type is 'text')
*   headers  : http headers (Referer, UserAgent etc. if type is 'url')
*   timeout  : http request timeout (seconds, if type is 'url')
*   tries    : how many times we request this resource (if type is 'url')
*   clipId   : clipping id
*   createdMs: created time (millisecond)
* }
*/

function createHtmlTask(filename, html, clipId) {
  return createTextTask(filename, html, 'text/html', clipId, 'mainFileTask');
}

function createMarkdownTask(filename, markdown, clipId) {
  return createTextTask(filename, markdown, 'text/markdown', clipId, 'mainFileTask');
}

function createStyleTask(filename, style, clipId) {
  return createTextTask(filename, style, 'text/css', clipId, 'styleFileTask');
}

function createFrameTask(filename, html, clipId) {
  return createTextTask(filename, html, 'text/html', clipId, 'frameFileTask');
}

function createTitleTask(filename, clipId) {
  return createTextTask(filename, '-', 'text/plain', clipId, 'titleFileTask');
}

function createInfoTask(filename, info) {
  const text = T.toJson(info);
  return createTextTask(filename, text, 'application/json', info.clipId, 'infoFileTask');
}

function createImageTask(filename, url, clipId) {
  return createUrlTask(filename, url, clipId, 'imageFileTask');
}

function createUrlTask(filename, url, clipId, taskType = 'assetFileTask', headers={}) {
  return {
    taskType: taskType,
    type: 'url',
    filename: filename,
    url: url,
    headers: headers,
    clipId: clipId,
    createdMs: T.currentTime().str.intMs,
  }
}

// @private
function createTextTask(filename, text, mimeType, clipId, taskType) {
  return {
    taskType: taskType,
    type: 'text',
    filename: filename,
    mimeType: mimeType,
    text: text,
    clipId: clipId,
    createdMs: T.currentTime().str.intMs,
  }
}

function rmReduplicate(tasks) {
  const result = [];
  const names = [];
  tasks.forEach((task) => {
    if (names.indexOf(task.filename) === -1) {
      result.push(task);
      names.push(task.filename);
    } else {
      console.debug('reduplicate task:', task);
    }
  });
  return result;
}

function changeUrlTask(tasks, action) {
  tasks.forEach((task) => {
    if (task.type === 'url') {
      task = action(task);
    }
  });
  return tasks;
}

/*
 * We want to save text tasks before url tasks.
 * because url task need to make a HTTP request.
 * HTTP request may be blocked or very slow.
 */
function sort(tasks) {
  const textTasks = [];
  const urlTasks = [];
  tasks.forEach((task) => {
    if (task.type === 'url') {
      urlTasks.push(task);
    } else {
      textTasks.push(task);
    }
  });
  return textTasks.concat(urlTasks);
}

function getRelativePath(tasks, currDir) {
  let mainPath;
  const paths = [];
  tasks.forEach((it) => {
    const path = T.calcPath(currDir, it.filename);
    if (it.taskType === 'mainFileTask') {
      mainPath = path;
    }
    paths.push(path);
  });
  return {mainPath: mainPath, paths: paths};
}

const Task = {
  createHtmlTask: createHtmlTask,
  createMarkdownTask: createMarkdownTask,
  createFrameTask: createFrameTask,
  createStyleTask: createStyleTask,
  createTitleTask: createTitleTask,
  createInfoTask: createInfoTask,
  createImageTask: createImageTask,
  createUrlTask: createUrlTask,
  rmReduplicate: rmReduplicate,
  changeUrlTask: changeUrlTask,
  sort: sort,
  getRelativePath: getRelativePath,
}

export default Task;
