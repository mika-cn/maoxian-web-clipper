"use strict";

import T from '../lib/tool.js';

const SAVING_TYPE = {CLIPPING: 0, TASK: 1};
const savingTypeDict = T.createDict(); // taskFilename => savingType

function startSaving(clipping, feedbackFn, options={}) {
  clipping.tasks.forEach((task) => {
    savingTypeDict.add(task.filename, SAVING_TYPE.CLIPPING);
  });
  Clipping.init(clipping, feedbackFn, options);
}

function retryTask(task, feedbackFn, options={}) {
  savingTypeDict.add(task.filename, SAVING_TYPE.TASK);
  Task.init(task, feedbackFn);
}

function taskFailed(taskFilename, errMsg) {
  const savingType = savingTypeDict.find(taskFilename);
  switch(savingType) {
    case SAVING_TYPE.CLIPPING:
      Clipping.taskFailed(taskFilename, errMsg);
      break;
    case SAVING_TYPE.TASK:
      Task.taskFailed(taskFilename, errMsg);
      break;
  }
  savingTypeDict.remove(taskFilename);
}

function taskCompleted(taskFilename, appendAttrs) {
  const savingType = savingTypeDict.find(taskFilename);
  switch(savingType) {
    case SAVING_TYPE.CLIPPING:
      Clipping.taskCompleted(taskFilename, appendAttrs);
      break;
    case SAVING_TYPE.TASK:
      Task.taskCompleted(taskFilename, appendAttrs);
      break;
  }
  savingTypeDict.remove(taskFilename);
}

const Task = (function() {

  const taskDict = T.createDict(); // taskFilename => task
  const feedbackFnDict = T.createDict(); // taskFilename => feedbackFn

  function init(task, feedbackFn) {
    taskDict.add(task.filename, task);
    feedbackFnDict.add(task.filename, feedbackFn);
    feedbackFn({type: 'started', clipId: task.clipId, taskFilename: task.filename});
  }

  function taskFailed(taskFilename, errMsg) {
    const task = taskDict.find(taskFilename);
    const feedbackFn = feedbackFnDict.find(taskFilename);
    if (task && feedbackFn) {
      feedbackFn({
        type: 'failed',
        clipId: task.clipId,
        taskFilename: task.filename,
        errMsg: errMsg,
      });
    }
    taskDict.remove(taskFilename);
    feedbackFnDict.remove(taskFilename);
  }

  function taskCompleted(taskFilename, appendAttrs={}) {
    const task = taskDict.find(taskFilename);
    const feedbackFn = feedbackFnDict.find(taskFilename);
    if (task && feedbackFn) {
      feedbackFn({
        type: 'completed',
        clipId: task.clipId,
        taskFilename: task.filename
      });
    }
    taskDict.remove(taskFilename);
    feedbackFnDict.remove(taskFilename);
  }

  return {init, taskFailed, taskCompleted};

})();

const Clipping = (function() {

  const clipIdDict = T.createDict(); // taskFilename => clipId
  const clippingDict = T.createDict(); // clipId => clipping
  const feedbackFnDict = T.createDict(); // clipId => feedbackFn
  let mode = 'completeWhenAllTaskFinished'; // or completeWhenMainTaskFinished

  function init(clipping, feedbackFn, options={}) {
    if(options.mode) {
      mode = options.mode;
    } else {
      throw new Error("'mode' must provided");
    }
    initClipIdDict(clipping);
    clippingDict.add(clipping.info.clipId, clipping);
    feedbackFnDict.add(clipping.info.clipId, feedbackFn);
    feedbackFn({ type: 'started', clipId: clipping.info.clipId});
  }

  function taskFailed(taskFilename, errMsg) {
    const clipId = clipIdDict.find(taskFilename);
    if(!clipId) {
      // If clipping handler invoke this function
      // without invoke startSaving function first,
      // It's OK, We do nothing.
      console.warn("<mx-wc>", "Couldn't find clipping with task filename: ", taskFilename);
      return;
    }
    const clipping = clippingDict.find(clipId);
    clipIdDict.remove(taskFilename);
    // if mode is 'completeWhenMainTaskFinished',
    // then clipping could be undefined
    if(clipping) {
      const currTask = setTaskAttrs(clipping, taskFilename, { state: 'failed', errMsg: errMsg });
      clippingDict.add(clipId, clipping);
      updateProgress(clipping, currTask);
    }
  }

  function taskCompleted(taskFilename, appendAttrs) {
    const clipId = clipIdDict.find(taskFilename);
    if(!clipId) {
      console.warn("<mx-wc>", "Couldn't find clipping with task filename: ", taskFilename);
      return;
    }
    const clipping = clippingDict.find(clipId);
    clipIdDict.remove(taskFilename);
    if(clipping){
      setTaskAttrs(clipping, taskFilename, { state: 'completed'});
      const currTask = setTaskAttrs(clipping, taskFilename, appendAttrs);
      clippingDict.add(clipId, clipping);
      updateProgress(clipping, currTask);
    }
  }

  function updateProgress(clipping, currTask) {
    const [finished, total] = calcProgress(clipping);
    const feedbackFn = feedbackFnDict.find(clipping.info.clipId);
    feedbackFn({type: 'progress', clipId: clipping.info.clipId, finished: finished, total: total});
    if(mode == 'completeWhenMainTaskFinished') {
      if(currTask.taskType === 'mainFileTask') {
        complete(clipping, feedbackFn);
      }
    } else {
      if(finished === total) {
        complete(clipping, feedbackFn);
      }
    }
  };

  function complete(clipping, feedbackFn) {
    const clippingResult = generateClippingResult(clipping);
    feedbackFn({
      type: 'completed',
      clippingResult: clippingResult
    });
    clippingDict.remove(clipping.info.clipId);
    feedbackFnDict.remove(clipping.info.clipId);
  }

  function generateClippingResult(clipping) {
    let mainTask = undefined;
    const completedTasks = [],
    failedTasks = [],
    pendingTasks = [];

    clipping.tasks.forEach((task) => {
      switch(task.state) {
        case 'completed':
          completedTasks.push(task);
          break;
        case 'failed':
          failedTasks.push(task);
          break;
        default:
          pendingTasks.push(task);
          break;
      }
      if(task.taskType === 'mainFileTask') {
        mainTask = task;
      }
    });

    const result = {
      clipId           : clipping.info.clipId,
      originalUrl      : clipping.info.link,
      filename         : mainTask.fullFilename,
      downloadItemId   : mainTask.downloadItemId,
      taskNum          : clipping.tasks.length,
      failedTaskNum    : failedTasks.length,
      pendingTaskNum   : pendingTasks.length,
      completedTaskNum : completedTasks.length,
    }
    if(failedTasks.length > 0) {
      result.failedTasks = failedTasks;
    }
    return result;
  }

  function initClipIdDict(clipping) {
    clipping.tasks.forEach((task) => {
      clipIdDict.add(task.filename, task.clipId);
    });
  }

  function setTaskAttrs(clipping, taskFilename, attrs) {
    const task = clipping.tasks.find((task) => {
      return task.filename === taskFilename;
    })
    if(task) {
      for(let attrName in attrs) {
        task[attrName] = attrs[attrName];
      }
      return task;
    } else {
      throw new Error("Shouldn't reach here");
    }
  }

  function calcProgress(clipping) {
    let finished = 0;
    clipping.tasks.forEach((task) => {
      if(['failed', 'completed'].indexOf(task.state) > -1) {
        finished += 1;
      }
    });
    return [finished, clipping.tasks.length];
  }

  return {init, taskFailed, taskCompleted};

})();

const SavingTool = {
  startSaving,
  retryTask,
  taskFailed,
  taskCompleted,
}

export default SavingTool;
