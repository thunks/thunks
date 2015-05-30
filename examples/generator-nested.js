'use strict'
/*global module, process*/

var thunk = require('../thunks.js')()
var fs = require('fs')

var size = thunk.thunkify(fs.stat)

var foo = thunk(function *() {
  var a = yield size('.gitignore')
  var b = yield size('thunks.js')
  var c = yield size('package.json')
  return [a, b, c]
})

var bar = thunk(function *() {
  var a = yield size('test/index.js')
  var b = yield size('test/generator.js')
  return [a, b]
})

thunk(function *() {
  return yield [foo, bar]
})(function (error, res) {
  console.log(error, res)
})
