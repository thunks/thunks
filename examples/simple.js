'use strict';
/*global module, process*/

var Thunk = require('../thunk.js')();
var thunk = Thunk(0);

function callback(error, value) {
  return ++value;
}
// No `Maximum call stack size exceeded` error in 1000000 sync series
console.time('Thunk_series');
for (var i = 0; i < 1000000; i++) {
  thunk = thunk(callback);
}
thunk(function (error, value) {
  console.log(error, value); // null, 1000000
  console.timeEnd('Thunk_series'); // ~1468ms
});

