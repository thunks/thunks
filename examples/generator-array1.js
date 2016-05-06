'use strict'
/*global module, process*/

var thunk = require('../thunks.js')()
var fs = require('fs')

var size = thunk.thunkify(fs.stat)

thunk(function * () {
  // 3 concurrent stat()s at a time
  var a = yield thunk.all([size('.gitignore'), size('thunks.js'), size('package.json')])
  var b = yield thunk.all([size('.gitignore'), size('thunks.js'), size('package.json')])
  var c = yield thunk.all([size('.gitignore'), size('thunks.js'), size('package.json')])
  console.log(a)
  console.log(b)
  console.log(c)
})(function * () {
  // 9 concurrent stat()s
  var a = [size('.gitignore'), size('thunks.js'), size('package.json')]
  var b = [size('.gitignore'), size('thunks.js'), size('package.json')]
  var c = [size('.gitignore'), size('thunks.js'), size('package.json')]
  var d = yield thunk.all([a, b, c])
  console.log(d)
})(function * () {
  var a = size('.gitignore')
  var b = size('thunks.js')
  var c = size('package.json')
  var res = yield thunk.all([a, b, c])
  console.log(res)
})()
