'use strict'
/*global console*/

var thunk = require('../thunks.js')()
var fs = require('fs')
var fsStat = thunk.thunkify(fs.stat)

fsStat('thunks.js')(function (error, result) {
  console.log('thunks.js: ', result, error)
})
fsStat('.gitignore')(function (error, result) {
  console.log('.gitignore: ', result, error)
})

var obj = {a: 8}

var run = function (x, callback) {
  // ...
  callback(null, this.a * x)
}

run = thunk.thunkify.call(obj, run)

run(1)(function (error, result) {
  console.log('run 1: ', result, error)
})
run(2)(function (error, result) {
  console.log('run 2: ', result, error)
})
