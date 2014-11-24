'use strict';
/*global console, noneFn*/

var Thunk = require('../thunks.js')();

Thunk(function (callback) {
  noneFn();
})(function (error, res) {
  // catch a error
  console.log(error, res); // [ReferenceError: noneFn is not defined] undefined
  noneFn();
})();
// none function to catch error, error will be throw.
// throw error: `ReferenceError: noneFn is not defined`
