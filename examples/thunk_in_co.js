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

Thunk(123)(function(err, res) {

  console.log(err, res); // null, 123
  return Promise.resolve(456);
})(function(err, res) {

  console.log(err, res); // null, 456
  return co(function *() {
    return yield [Thunk('a'), Promise.resolve('b')];
  });
})(function(err, res) {
  console.log(err, res); // null, ['a', 'b']
});
