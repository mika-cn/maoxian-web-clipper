
import T        from '../js/lib/tool.js';
import I18N     from '../js/lib/translation.js';
import ExtMsg   from '../js/lib/ext-msg.js';
import MxWcStorage from '../js/lib/storage.js';

import './_base.css';
import './failed-tasks.css';

function listenMessage() {
  ExtMsg.listen('failed-tasks', function(msg) {
    return new Promise((resolve, reject) => {
      switch(msg.type) {
        case 'retry.task.feedback':
          // logfeedback
          logFeedback(msg.body);
          // update task
          updateTask(msg.body);
        break;
      }
    });
  });
}

function logFeedback(msg) {
  const tpl = T.findElem('log-tpl').innerHTML;
  const newNode = document.createElement('div');
  newNode.innerHTML = T.renderTemplate(tpl, Object.assign({}, msg, {errMsg: (msg.errMsg || '').replace(/\n/g, '<br />')}))
  const container = T.firstElem('logs');
  container.appendChild(newNode);
}

function updateTask({type, clipId, taskFilename, errMsg = undefined}) {
  const task = state.tasks.find((it) => {
    return it.clipId === clipId && taskFilename === it.filename;
  });
  if (task) {
    switch(type) {
      case 'failed':
        task.errMsg = errMsg;
        break;
      case 'completed':
        const idx = state.tasks.indexOf(task);
        state.tasks.splice(idx, 1);
        console.log(state.tasks.length);
        // This may invoke many times in a short period of time.
        // should we avoid it.
        MxWcStorage.set('failedTasks', state.tasks);
        renderTasks(state.tasks);
        break;
    }
  }
}

function bindListener() {
  const btn = T.findElem('retry-all');
  T.bindOnce(btn, 'click', retryAll);
  const form = T.queryElem('.batch-editor > form');
  T.bindOnce(form, 'submit', editAll);
}

async function retryAll() {
  T.setHtml('.logs', '');
  const tasks = await MxWcStorage.get('failedTasks', []);
  tasks.forEach((it) => { retryTask(it)});
}

function editAll(e) {
  const form = e.target;
  const timeout = parseInt(T.findElem('timeout', form).value)
  const tries = parseInt(T.findElem('tries', form).value)
  const changes = {};
  if (!isNaN(timeout)) { changes.timeout = timeout }
  if (!isNaN(tries))   { changes.tries = tries }
  const tasks = []
  state.tasks.forEach((it) => {
    tasks.push(editTask(it, changes));
  });
  MxWcStorage.set('failedTasks', tasks);
  renderTasks(tasks);
  e.stopPropagation();
  e.preventDefault();
}

function editTask(task, changes) {
  for (let key in changes) {
    task[key] = changes[key];
  }
  return task;
}

function retryTask(task) {
  return ExtMsg.sendToBackend('saving', {
    type: 'retry.task',
    body: task
  });
}

function renderTasks(tasks) {
  if (tasks.length > 0) {
    const tpl = T.findElem('task-tpl').innerHTML;
    const html = tasks.map((it) => {
      const createdAt = T.wrapDate(new Date(parseInt(it.createdMs))).toString();
      return T.renderTemplate(tpl, Object.assign({createdAt: createdAt}, it));
    }).join('');
    T.setHtml('.tasks > .details tbody', html);
  } else {
    const html = T.findElem('no-record-tpl').innerHTML;
    T.setHtml('.tasks > .details tbody', html);
  }
}

const state = {tasks: []}

function init() {
  listenMessage();
  bindListener();
  MxWcStorage.get('failedTasks', []).then((tasks) => {
    state.tasks = tasks;
    renderTasks(tasks);
    I18N.i18nPage();
  });
}

init();
