'use strict';
/*global console*/

var Thunk = require('../thunks.js')();
var result = [];

console.time('Thunk_series');
Thunk.seq([1, 2, 3, 4, 5].map(function (index) {
  return function (callback) {
    setTimeout(function () { callback(null, index * 2); }, 1000);
  };
}))(function (error, result) {
  console.log(error, result); // null, [2, 4, 6, 8, 10]
  console.timeEnd('Thunk_series'); // ~5055ms
});
