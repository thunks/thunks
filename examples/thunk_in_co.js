'use strict';
/*global console*/

var Thunk = require('../thunks.js')();
var co = require('co');

var thunk = Thunk(function (callback) {
  setTimeout(function () { callback(null, 1); });
});

co(function *() {
  var a = yield thunk;
  return yield [a, Thunk(2), Thunk(function (callback) {
    setTimeout(function () { callback(null, 3); });
  })];
})(function (error, value) {
  console.log(error, value); // null [1, 2, 3]
});
