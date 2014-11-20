'use strict';
/*global Promise */

var Thunk = require('../thunks.js')();

module.exports = function (len, syncMode) {
  var task, list = [], tasks = [];

  if (syncMode) { // 模拟同步任务
    task = function (value, callback) {
      callback(null, value);
    };
  } else { // 模拟异步任务
    task = function (value, callback) {
      setImmediate(function () {
        callback(null, value);
      });
    };
  }

  // 构造任务队列
  for (var i = 0; i < len; i++) {
    tasks[i] = task;
  }

  return function (callback) {
    // Thunk 测试主体
    Thunk.
      all(tasks.map(function (task) { // 并行 tasks 队列
        return Thunk(function (callback) {
          task(1, callback);
        });
      }))(function () { // 串行 tasks 队列
        return Thunk.seq(tasks.map(function (task) { // 并行 tasks 队列
          return Thunk(function (callback) {
            task(1, callback);
          });
        }));
      })(callback);
  };
};
