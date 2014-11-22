'use strict';
/*global console, Promise*/

var JSBench = require('jsbench'),
  len = 1000, // 任务队列长度
  cycles = 1000, // 每个测试体运行次数
  syncMode = true; // 用同步任务测试

var jsbench = new JSBench();

console.log((syncMode ? 'Sync' : 'Async') + ' Benchmark...');

// 如果支持 Promise，则加入 Promise 测试
if (typeof Promise === 'function') {
  jsbench.add('Promise', require('./same-promise.js')(len, syncMode));
} else {
  console.log('Not support Promise!');
}

jsbench.
  add('thunks', require('./same-thunks.js')(len, syncMode)).
  // on('cycle', function (e) { console.log(e.name, e.cycle, e.time + 'ms'); }).
  on('error', function (e) { console.error(e.name, e.error.stack); }).
  run(cycles);
