'use strict'
/*global module, process*/

var thunk = require('../thunks.js')()
var fs = require('fs')

var read = thunk.thunkify(fs.readFile)

thunk(function *() {
  // sequential
  var a = yield read('.gitignore')
  var b = yield read('thunks.js')
  var c = yield read('package.json')
  return [a.length, b.length, c.length]

})(function *(error, res) {
  console.log(error, res)
  // parallel
  var a = read('.gitignore')
  var b = read('thunks.js')
  var c = read('package.json')

  return [
    (yield a).length,
    (yield b).length,
    (yield c).length
  ]

})(function *(error, res) {
  console.log(error, res)
  yield read('.gitignore')
  // return generator function
  return function *() {
    return yield read('thunks.js')
  }
})(function *(error, res) {
  console.log(error, res.length)
  yield read('package.json')
  // return generator function
  return (function *() {
    return yield read('.gitignore')
  })()
})(function (error, res) {
  console.log(error, res.length)
})
