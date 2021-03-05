
const TASK_STATE = {
  PENDING    : 0,
  FAILED     : 1,
  COMPLETED : 2,
}

const MODE = {
  COMPLETE_WHEN_ALL_TASK_FINISHED  : 0,
  COMPLETE_WHEN_MAIN_TASK_FINISHED : 1,
}

class SaveClipping {

  constructor(clipping, feedback, {mode = null}) {
    this.clipping = clipping;
    this.feedback = feedback;
    this.mode = (mode || MODE.COMPLETE_WHEN_ALL_TASK_FINISHED);
  }

  static get MODE() {
    return MODE;
  }

  taskFailed(task, errMsg) {
    task.state = TASK_STATE.FAILED;
    task.errMsg = errMsg;
    this.updateProgress(task);
  }

  taskCompleted(task, appendAttrs) {
    task.state = TASK_STATE.COMPLETED;
    if (appendAttrs) {
      for (let attrName in appendAttrs) {
        task[attrName] = appendAttrs[attrName];
      }
    }
    this.updateProgress(task);
  }


  updateProgress(currTask) {
    const [finished, total] = this.calcProgress();
    console.log('finish: ', finished, 'total: ', total);
    this.feedback({
      type: 'progress',
      clipId: this.clipping.info.clipId,
      finished: finished,
      total: total
    });
    if(this.mode == MODE.COMPLETE_WHEN_MAIN_TASK_FINISHED) {
      if(currTask.taskType === 'mainFileTask') {
        this.complete();
      }
    } else {
      if(finished === total) {
        this.complete();
      }
    }
  }

  complete() {
    this.feedback({
      type: 'completed',
      clippingResult: this.generateSavingResult()
    });
  }

  generateSavingResult() {
    let mainTask = undefined;
    const completedTasks = [],
    failedTasks = [],
    pendingTasks = [];

    this.clipping.tasks.forEach((task) => {
      switch(task.state) {
        case TASK_STATE.COMPLETED:
          completedTasks.push(task);
          break;
        case TASK_STATE.FAILED:
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
      clipId           : this.clipping.info.clipId,
      originalUrl      : this.clipping.info.link,
      filename         : mainTask.fullFilename,
      downloadItemId   : mainTask.downloadItemId,
      taskNum          : this.clipping.tasks.length,
      failedTaskNum    : failedTasks.length,
      pendingTaskNum   : pendingTasks.length,
      completedTaskNum : completedTasks.length,
    }
    if(failedTasks.length > 0) {
      result.failedTasks = failedTasks;
    }
    return result;
  }

  calcProgress() {
    let finished = 0;
    this.clipping.tasks.forEach((task) => {
      if ([TASK_STATE.FAILED, TASK_STATE.COMPLETED].indexOf(task.state) > -1) {
        finished++;
      }
    });
    return [finished, this.clipping.tasks.length];
  }
}


class RetryTask {
  constructor(task, feedback) {
    this.task = task;
    this.feedback = feedback;
  }

  started() {
    this.feedback({
      type: 'started',
      clipId: this.task.clipId,
      taskFilename: this.task.filename
    });
  }

  failed(errMsg) {
    this.feedback({
      clipId: this.task.clipId,
      taskFilename: this.task.filename,
      errMsg: errMsg,
    });
  }

  completed() {
    this.feedback({
      type: 'completed',
      clipId: this.task.clipId,
      taskFilename: this.task.filename
    });
  }
}

export default {SaveClipping, RetryTask};
