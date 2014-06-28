'use strict';
/*global console*/

var Thunk = require('../thunks.js')();
var Then = require('thenjs');

var thunk = Thunk(function (callback) {
  setTimeout(function () { callback(null, 1); });
});

Then(thunk).
  then(function (cont, value) {
    console.log(value); // 1
    cont();
  }).
  parallel([Thunk(1), Thunk(2), Thunk(function (callback) {
    setTimeout(function () { callback(null, 3); });
  })]).
  then(function (cont, value) {
    console.log(value); // [1, 2, 3]
  });
