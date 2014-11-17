'use strict';
/*global module, process*/

var Thunk = require('../thunks.js')();
var thunk = Thunk(0);

function callback(error, value) {
  return ++value;
}
// No `Maximum call stack size exceeded` error in 10000000 sync series
console.time('Thunk_series');
for (var i = 0; i < 10000000; i++) {
  thunk = thunk(callback);
}
thunk(function (error, value) {
  console.log(error, value); // null, 10000000
  console.timeEnd('Thunk_series'); // ~9130ms
});

console.log('Thunk.delay 500: ', Date.now());
Thunk.delay(500)(function () {
  console.log('Thunk.delay 1000: ', Date.now());
  return Thunk.delay(1000);
})(function () {
  console.log('Thunk.delay end: ', Date.now());
});
