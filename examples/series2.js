'use strict';
/*global console*/

var Thunk = require('../thunks.js')();
var result = [];

console.time('Thunk_series');
[1, 2, 3, 4, 5].reduce(function (thunk, index) {
  return thunk(function (error, value) {
    result.push(value);
    return Thunk(function (callback) {
      setTimeout(function () { callback(null, value * 2); }, 1000);
    });
  });
}, Thunk(1))(function (error) {
  console.log(error, result); // null, [1, 2, 4, 8, 16]
  console.timeEnd('Thunk_series'); // ~5055ms
});
