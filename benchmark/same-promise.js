'use strict';
/*global Promise */

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
    // 原生 Promise 测试主体
    Promise
      .all(tasks.map(function (task) { // 并行 tasks 队列
        return new Promise(function (resolve, reject) {
          task(1, function (error, value) {
            if (error) return reject(error);
            resolve(value);
          });
        });
      }))
      .then(function () { // 串行 tasks 队列
        return tasks.reduce(function (promise, task) {
          return promise.then(function (value) {
            return new Promise(function (resolve, reject) {
              task(1, function (error, value) {
                if (error) return reject(error);
                resolve(value);
              });
            });
          });
        }, Promise.resolve(null));
      })
      .then(function (value) {
        callback(null, value);
      })
      .catch(callback);
  };
};
