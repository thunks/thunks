'use strict';
/*global console*/

var Thunk = require('../thunks.js')();
var result = [], thunk = Thunk(1);

function callback(error, value) {
  result.push(value);
  return Thunk(function (callback2) {
    setTimeout(function () { callback2(null, value * 2); }, 1000);
  });
}
console.time('Thunk_series');
for (var i = 0; i < 5; i++) {
  thunk = thunk(callback);
}
thunk(function (error) {
  console.log(error, result); // null, [1, 2, 4, 8, 16]
  console.timeEnd('Thunk_series'); // ~5050ms
});
