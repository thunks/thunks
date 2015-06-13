'use strict'
/*global console*/

var thunk = require('../thunks.js')()
var result = []
var thunkFn = thunk(1)

function callback (error, value) {
  if (error != null) throw error
  result.push(value)
  return thunk(function (callback2) {
    setTimeout(function () { callback2(null, value * 2) }, 1000)
  })
}
console.time('thunk_series')
for (var i = 0; i < 5; i++) {
  thunkFn = thunkFn(callback)
}
thunkFn(function (error) {
  console.log(error, result) // null, [1, 2, 4, 8, 16]
  console.timeEnd('thunk_series') // ~5050ms
})
