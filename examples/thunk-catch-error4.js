'use strict';
/*global console, noneFn*/

var Thunk = require('../thunks.js')(function (error) {
  // any error will be catched by this function
  console.log('catched error: ', error);
  // catched error:  [ReferenceError: noneFn is not defined]
  // catched error:  [ReferenceError: noneFn is not defined]
  // catched error:  error
  // catched error:  error2
  return true; // ignore error, continue to run other functions
});

Thunk(function (callback) {
  noneFn();
  callback(null, 1);
})(function (error, res) {
  // this function will be run.
  console.log(error, res); // null undefined
  noneFn();
})();

Thunk(function (callback) {
  throw 'error';
})(function (error, res) {
  // this function will be run.
  console.log(error, res); // null undefined
})();

Thunk(1)(function (error, res) {
  console.log(error, res); // null 1
  return Thunk(function () { throw 'error2'; });
})();
