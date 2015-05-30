'use strict'
/*global module, process*/

var thunk = require('../thunks.js')()
var fs = require('fs')

var size = thunk.thunkify(fs.stat)

size('.gitignore')(function (error, res) {
  console.log(error, res)
  return size('thunks.js')

})(function (error, res) {
  console.log(error, res)
  return size('package.json')

})(function *(error, res) {
  console.log(error, res)
  // generator
  var a = yield size('.gitignore')
  var b = yield size('thunks.js')
  var c = yield size('package.json')
  console.log(a)
  console.log(b)
  console.log(c)
})()
