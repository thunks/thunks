'use strict';
/*global console*/

var thunk = require('../thunks.js')();
var Then = require('thenjs');

var thunkFn = thunk(function(callback) {
  setTimeout(function() { callback(null, 1); });
});

Then(thunk).
  then(function(cont, value) {
    console.log(value); // 1
    cont();
  }).
  parallel([thunk(1), thunk(2), thunk(function(callback) {
    setTimeout(function() { callback(null, 3); });
  })]).
  then(function(cont, value) {
    console.log(value); // [1, 2, 3]
  });
