'use strict';
/*global console*/

var Thunk = require('../thunks.js')();

console.time('Thunk_parallel');
Thunk.
  all([
    Thunk(function (callback) { setTimeout(function () { callback(null, 1); }, 1000); }),
    2,
    Thunk(3),
    Thunk(Thunk(4)),
    Thunk(function (callback) { setTimeout(function () { callback(null, 5); }, 1000); }),
  ])(function (error, result) {
    console.log(error, result); // null, [1, 2, 3, 4, 5]
    console.timeEnd('Thunk_parallel'); // ~1014ms
  });
