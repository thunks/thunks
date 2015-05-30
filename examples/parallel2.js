'use strict'
/*global console*/

var thunk = require('../thunks.js')()

console.time('thunk_parallel')
thunk.all([1, 2, 3, 4, 5].map(function (index) {
  return thunk(function (callback) { setTimeout(function () { callback(null, index * 2) }, 1000) })
}))(function (error, result) {
  console.log(error, result) // null, [2, 4, 6, 8, 10]
  console.timeEnd('thunk_parallel') // ~1018ms
})
