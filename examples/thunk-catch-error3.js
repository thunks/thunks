'use strict';
/*global console, noneFn*/

var Thunk = require('../thunks.js')(function (error) {
  // any error will be catched by this function
  console.log('catched error: ', error);
  // catched error:  [ReferenceError: noneFn is not defined]
  // catched error:  error
  // catched error:  error2
});

Thunk(function (callback) {
  noneFn();
})(function (error, res) {
  // this function will not be run.
  console.log(error, res);
  noneFn();
})();

Thunk(function (callback) {
  throw 'error';
})(function (error, res) {
  // this function will not be run.
  console.log(error, res);
  noneFn();
})();

Thunk(1)(function (error, res) {
  console.log(error, res); // null 1
  return Thunk(function () { throw 'error2'; });
})();
