'use strict';
/*global console*/

var Thunk = require('../thunks.js')();

console.time('Thunk_parallel');
Thunk.
  all([1, 2, 3, 4, 5].map(function (index) {
    return Thunk(function (callback) { setTimeout(function () { callback(null, index * 2); }, 1000); });
  }))(function (error, result) {
    console.log(error, result); // null, [2, 4, 6, 8, 10]
    console.timeEnd('Thunk_parallel'); // ~1018ms
  });
