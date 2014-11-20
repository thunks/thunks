'use strict';
/*global module, process*/

var Thunk = require('../thunks.js')();
var thunk = Thunk(function* () {
  var x = yield 10;
  return 2 * x;
})(function* (error, res) {
  console.log(error, res); // null, 20

  return yield [1, 2, Thunk(3)];
})(function* (error, res) {
  console.log(error, res); // null, [1, 2, 3]
  return yield {
    name: 'test',
    value: Thunk(1)
  };
})(function (error, res) {
  console.log(error, res); // null, {name: 'test', value: 1}
});
