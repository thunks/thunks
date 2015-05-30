'use strict'
/*global console*/

var thunk = require('../thunks.js')()

console.time('thunk_parallel')
thunk.all([
  thunk(function (callback) { setTimeout(function () { callback(null, 1) }, 1000) }),
  2,
  thunk(3),
  thunk(thunk(4)),
  thunk(function (callback) { setTimeout(function () { callback(null, 5) }, 1000) })
])(function (error, result) {
  console.log(error, result) // null, [1, 2, 3, 4, 5]
  console.timeEnd('thunk_parallel') // ~1014ms
})
