'use strict'
/*global console*/

var thunks = require('../thunks.js')
var fs = require('fs')
var thunk = thunks(function (error) { console.error('Thunk error:', error) })

thunk.all(['examples/demo.js', 'thunks.js', '.gitignore'].map(function (path) {
  return thunk(function (callback) { fs.stat(path, callback) })
}))(function (error, result) {
  console.log(error, result)
  return thunk(function (callback) { fs.stat('none.js', callback) })
})(function (error, result) {
  console.error('This should not run!', error)
})
