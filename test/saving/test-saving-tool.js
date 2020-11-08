
import H from '../helper.js';
import SavingTool from '../../src/js/saving/saving-tool.js';

describe('SavingTool', () => {

  describe('Clipping', () => {
    const MODE = 'completeWhenAllTaskFinished';
    it("should send started msg", () => {
      const clipping = {info: {clipId: '001'}, tasks: []}
      const feedback = function(msg) {
        H.assertEqual(msg.type, 'started');
      }
      SavingTool.startSaving(clipping, feedback, {mode: MODE});
    });

    it("should send progress msg", () => {
      const tasks = [
        {taskType: 'mainFileTask', clipId: '001', filename: 'task01.md' },
        {taskType: 'imageFileTask', clipId: '001', filename: 'task02.jpg' },
      ];
      const clipping = {info: {clipId: '001'}, tasks: tasks}
      let i = -1;
      const feedback = function(msg) {
        i++;
        if ( i > 0 && i <=tasks.length) {
          H.assertEqual(msg.type, 'progress');
          H.assertEqual(msg.total, tasks.length);
          H.assertEqual(msg.finished, i);
        }
      }
      SavingTool.startSaving(clipping, feedback, {mode: MODE});
      SavingTool.taskFailed(tasks[0].filename, 'Error');
      SavingTool.taskCompleted(tasks[1].filename);
    });

    it("should send completed msg", () => {
      const tasks = [{taskType: 'mainFileTask', clipId: '001', filename: 'task01.md' }];
      const clipping = {info: {clipId: '001'}, tasks: tasks}
      let i = -1;
      const feedback = function(msg) {
        i++;
        if ( i == 2){
          H.assertEqual(msg.type, 'completed');
          H.assertEqual(msg.clippingResult.clipId, clipping.info.clipId);
        }
      }
      SavingTool.startSaving(clipping, feedback, {mode: MODE});
      SavingTool.taskCompleted(tasks[0].filename);
    });

  });

  describe('Task', () => {
    it("should send started msg", () => {
      const task = {clipId: '001', filename: 'task01.jpg'};
      const feedback = function(msg) {
        H.assertEqual(msg.type, 'started');
      }
      SavingTool.retryTask(task, feedback);
    });

    it("should send failed msg", () => {
      const task = {clipId: '001', filename: 'task01.jpg'};
      let i=-1;
      const feedback = function(msg) {
        i++;
        if (i == 1) {
          H.assertEqual(msg.type, 'failed');
        }
      }
      SavingTool.retryTask(task, feedback);
      SavingTool.taskFailed(task.filename, 'Error');
    });

    it("should send completed msg", () => {
      const task = {clipId: '001', filename: 'task01.jpg'};
      let i=-1;
      const feedback = function(msg) {
        i++;
        if (i == 1) {
          H.assertEqual(msg.type, 'completed');
        }
      }
      SavingTool.retryTask(task, feedback);
      SavingTool.taskCompleted(task.filename);
    });
  });

  describe('Other', () => {
    it("should not do anything", () => {
      const task = {clipId: '001', filename: 'task01.jpg'};
      SavingTool.taskCompleted(task.filename);
    });
  });


});
