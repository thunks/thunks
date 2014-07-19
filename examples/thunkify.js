'use strict';
/*global console*/

var Thunk = require('../thunks.js')();
var fs = require('fs');
var fsStat = Thunk.thunkify(fs.stat);

fsStat('thunks.js')(function (error, result) {
  console.log('thunks.js: ', result);
});
fsStat('.gitignore')(function (error, result) {
  console.log('.gitignore: ', result);
});

var obj = {a: 8};
obj.run = function (x, callback) {
	//...
	callback(null, this.a * x);
};

var run = Thunk.thunkify(obj.run);

run.call(obj, 1)(function (error, result) {
  console.log('run 1: ', result);
});
run.call(obj, 2)(function (error, result) {
  console.log('run 2: ', result);
});