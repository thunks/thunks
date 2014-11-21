'use strict';
/*global module, process*/

var Thunk = require('../thunks.js')();
var fs = require('fs');

var size = Thunk.thunkify(fs.stat);

var foo = Thunk(function* () {
  var a = yield size('.gitignore');
  var b = yield size('thunks.js');
  var c = yield size('package.json');
  return [a, b, c];
});

var bar = Thunk(function* () {
  var a = yield size('test/index.js');
  var b = yield size('test/generator.js');
  return [a, b];
});

Thunk(function* () {
  return yield [foo, bar];
})(function (error, res) {
  console.log(error, res);
});
